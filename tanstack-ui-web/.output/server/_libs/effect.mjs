const pipeArguments = (self, args2) => {
  switch (args2.length) {
    case 0:
      return self;
    case 1:
      return args2[0](self);
    case 2:
      return args2[1](args2[0](self));
    case 3:
      return args2[2](args2[1](args2[0](self)));
    case 4:
      return args2[3](args2[2](args2[1](args2[0](self))));
    case 5:
      return args2[4](args2[3](args2[2](args2[1](args2[0](self)))));
    case 6:
      return args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))));
    case 7:
      return args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))));
    case 8:
      return args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self))))))));
    case 9:
      return args2[8](args2[7](args2[6](args2[5](args2[4](args2[3](args2[2](args2[1](args2[0](self)))))))));
    default: {
      let ret = self;
      for (let i = 0, len = args2.length; i < len; i++) {
        ret = args2[i](ret);
      }
      return ret;
    }
  }
};
const Prototype = {
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const Class$2 = /* @__PURE__ */ (function() {
  function PipeableBase() {
  }
  PipeableBase.prototype = Prototype;
  return PipeableBase;
})();
const dual = function(arity, body) {
  if (typeof arity === "function") {
    return function() {
      return arity(arguments) ? body.apply(this, arguments) : (self) => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function(a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function(self) {
          return body(self, a);
        };
      };
    case 3:
      return function(a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function(self) {
          return body(self, a, b);
        };
      };
    default:
      return function() {
        if (arguments.length >= arity) {
          return body.apply(this, arguments);
        }
        const args2 = arguments;
        return function(self) {
          return body(self, ...args2);
        };
      };
  }
};
const identity = (a) => a;
const constant = (value) => () => value;
const constTrue = /* @__PURE__ */ constant(true);
const constFalse = /* @__PURE__ */ constant(false);
const constUndefined = /* @__PURE__ */ constant(void 0);
const constVoid = constUndefined;
function memoize(f) {
  const cache = /* @__PURE__ */ new WeakMap();
  return (a) => {
    if (cache.has(a)) {
      return cache.get(a);
    }
    const result2 = f(a);
    cache.set(a, result2);
    return result2;
  };
}
const getAllObjectKeys = (obj) => {
  const keys2 = new Set(Reflect.ownKeys(obj));
  if (obj.constructor === Object) return keys2;
  if (obj instanceof Error) {
    keys2.delete("stack");
  }
  const proto = Object.getPrototypeOf(obj);
  let current = proto;
  while (current !== null && current !== Object.prototype) {
    const ownKeys = Reflect.ownKeys(current);
    for (let i = 0; i < ownKeys.length; i++) {
      keys2.add(ownKeys[i]);
    }
    current = Object.getPrototypeOf(current);
  }
  if (keys2.has("constructor") && typeof obj.constructor === "function" && proto === obj.constructor.prototype) {
    keys2.delete("constructor");
  }
  return keys2;
};
const byReferenceInstances = /* @__PURE__ */ new WeakSet();
function isString(input) {
  return typeof input === "string";
}
function isNumber(input) {
  return typeof input === "number";
}
function isBoolean(input) {
  return typeof input === "boolean";
}
function isBigInt(input) {
  return typeof input === "bigint";
}
function isFunction(input) {
  return typeof input === "function";
}
function isNotUndefined(input) {
  return input !== void 0;
}
function isNotNullish(input) {
  return input != null;
}
function isNever$1(_) {
  return false;
}
function isUnknown(_) {
  return true;
}
function isObjectKeyword(input) {
  return typeof input === "object" && input !== null || isFunction(input);
}
const hasProperty = /* @__PURE__ */ dual(2, (self, property) => isObjectKeyword(self) && property in self);
function isIterable(input) {
  return hasProperty(input, Symbol.iterator) || isString(input);
}
const symbol$2 = "~effect/interfaces/Hash";
const hash = (self) => {
  switch (typeof self) {
    case "number":
      return number$1(self);
    case "bigint":
      return string$1(self.toString(10));
    case "boolean":
      return string$1(String(self));
    case "symbol":
      return string$1(String(self));
    case "string":
      return string$1(self);
    case "undefined":
      return string$1("undefined");
    case "function":
    case "object": {
      if (self === null) {
        return string$1("null");
      } else if (self instanceof Date) {
        return string$1(self.toISOString());
      } else if (self instanceof RegExp) {
        return string$1(self.toString());
      } else {
        if (byReferenceInstances.has(self)) {
          return random(self);
        }
        if (hashCache.has(self)) {
          return hashCache.get(self);
        }
        const h = withVisitedTracking$1(self, () => {
          if (isHash(self)) {
            return self[symbol$2]();
          } else if (typeof self === "function") {
            return random(self);
          } else if (Array.isArray(self)) {
            return array(self);
          } else if (self instanceof Map) {
            return hashMap(self);
          } else if (self instanceof Set) {
            return hashSet(self);
          }
          return structure(self);
        });
        hashCache.set(self, h);
        return h;
      }
    }
    default:
      throw new Error(`BUG: unhandled typeof ${typeof self} - please report an issue at https://github.com/Effect-TS/effect/issues`);
  }
};
const random = (self) => {
  if (!randomHashCache.has(self)) {
    randomHashCache.set(self, number$1(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)));
  }
  return randomHashCache.get(self);
};
const combine = /* @__PURE__ */ dual(2, (self, b) => self * 53 ^ b);
const optimize = (n) => n & 3221225471 | n >>> 1 & 1073741824;
const isHash = (u) => hasProperty(u, symbol$2);
const number$1 = (n) => {
  if (n !== n) {
    return string$1("NaN");
  }
  if (n === Infinity) {
    return string$1("Infinity");
  }
  if (n === -Infinity) {
    return string$1("-Infinity");
  }
  let h = n | 0;
  if (h !== n) {
    h ^= n * 4294967295;
  }
  while (n > 4294967295) {
    h ^= n /= 4294967295;
  }
  return optimize(h);
};
const string$1 = (str) => {
  let h = 5381, i = str.length;
  while (i) {
    h = h * 33 ^ str.charCodeAt(--i);
  }
  return optimize(h);
};
const structureKeys = (o, keys2) => {
  let h = 12289;
  for (const key of keys2) {
    h ^= combine(hash(key), hash(o[key]));
  }
  return optimize(h);
};
const structure = (o) => structureKeys(o, getAllObjectKeys(o));
const iterableWith = (seed, f) => (iter) => {
  let h = seed;
  for (const element of iter) {
    h ^= f(element);
  }
  return optimize(h);
};
const array = /* @__PURE__ */ iterableWith(6151, hash);
const hashMap = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string$1("Map"), ([k, v]) => combine(hash(k), hash(v)));
const hashSet = /* @__PURE__ */ iterableWith(/* @__PURE__ */ string$1("Set"), hash);
const randomHashCache = /* @__PURE__ */ new WeakMap();
const hashCache = /* @__PURE__ */ new WeakMap();
const visitedObjects = /* @__PURE__ */ new WeakSet();
function withVisitedTracking$1(obj, fn) {
  if (visitedObjects.has(obj)) {
    return string$1("[Circular]");
  }
  visitedObjects.add(obj);
  const result2 = fn();
  visitedObjects.delete(obj);
  return result2;
}
const symbol$1 = "~effect/interfaces/Equal";
function equals$1() {
  if (arguments.length === 1) {
    return (self) => compareBoth(self, arguments[0]);
  }
  return compareBoth(arguments[0], arguments[1]);
}
function compareBoth(self, that) {
  if (self === that) return true;
  if (self == null || that == null) return false;
  const selfType = typeof self;
  if (selfType !== typeof that) {
    return false;
  }
  if (selfType === "number" && self !== self && that !== that) {
    return true;
  }
  if (selfType !== "object" && selfType !== "function") {
    return false;
  }
  if (byReferenceInstances.has(self) || byReferenceInstances.has(that)) {
    return false;
  }
  return withCache(self, that, compareObjects);
}
function withVisitedTracking(self, that, fn) {
  const hasLeft = visitedLeft.has(self);
  const hasRight = visitedRight.has(that);
  if (hasLeft && hasRight) {
    return true;
  }
  if (hasLeft || hasRight) {
    return false;
  }
  visitedLeft.add(self);
  visitedRight.add(that);
  const result2 = fn();
  visitedLeft.delete(self);
  visitedRight.delete(that);
  return result2;
}
const visitedLeft = /* @__PURE__ */ new WeakSet();
const visitedRight = /* @__PURE__ */ new WeakSet();
function compareObjects(self, that) {
  if (hash(self) !== hash(that)) {
    return false;
  } else if (self instanceof Date) {
    if (!(that instanceof Date)) return false;
    return self.toISOString() === that.toISOString();
  } else if (self instanceof RegExp) {
    if (!(that instanceof RegExp)) return false;
    return self.toString() === that.toString();
  }
  const selfIsEqual = isEqual(self);
  const thatIsEqual = isEqual(that);
  if (selfIsEqual !== thatIsEqual) return false;
  const bothEquals = selfIsEqual && thatIsEqual;
  if (typeof self === "function" && !bothEquals) {
    return false;
  }
  return withVisitedTracking(self, that, () => {
    if (bothEquals) {
      return self[symbol$1](that);
    } else if (Array.isArray(self)) {
      if (!Array.isArray(that) || self.length !== that.length) {
        return false;
      }
      return compareArrays(self, that);
    } else if (self instanceof Map) {
      if (!(that instanceof Map) || self.size !== that.size) {
        return false;
      }
      return compareMaps(self, that);
    } else if (self instanceof Set) {
      if (!(that instanceof Set) || self.size !== that.size) {
        return false;
      }
      return compareSets(self, that);
    }
    return compareRecords(self, that);
  });
}
function withCache(self, that, f) {
  let selfMap = equalityCache.get(self);
  if (!selfMap) {
    selfMap = /* @__PURE__ */ new WeakMap();
    equalityCache.set(self, selfMap);
  } else if (selfMap.has(that)) {
    return selfMap.get(that);
  }
  const result2 = f(self, that);
  selfMap.set(that, result2);
  let thatMap = equalityCache.get(that);
  if (!thatMap) {
    thatMap = /* @__PURE__ */ new WeakMap();
    equalityCache.set(that, thatMap);
  }
  thatMap.set(self, result2);
  return result2;
}
const equalityCache = /* @__PURE__ */ new WeakMap();
function compareArrays(self, that) {
  for (let i = 0; i < self.length; i++) {
    if (!compareBoth(self[i], that[i])) {
      return false;
    }
  }
  return true;
}
function compareRecords(self, that) {
  const selfKeys = getAllObjectKeys(self);
  const thatKeys = getAllObjectKeys(that);
  if (selfKeys.size !== thatKeys.size) {
    return false;
  }
  for (const key of selfKeys) {
    if (!thatKeys.has(key) || !compareBoth(self[key], that[key])) {
      return false;
    }
  }
  return true;
}
function makeCompareMap(keyEquivalence, valueEquivalence) {
  return function compareMaps2(self, that) {
    for (const [selfKey, selfValue] of self) {
      let found = false;
      for (const [thatKey, thatValue] of that) {
        if (keyEquivalence(selfKey, thatKey) && valueEquivalence(selfValue, thatValue)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
const compareMaps = /* @__PURE__ */ makeCompareMap(compareBoth, compareBoth);
function makeCompareSet(equivalence) {
  return function compareSets2(self, that) {
    for (const selfValue of self) {
      let found = false;
      for (const thatValue of that) {
        if (equivalence(selfValue, thatValue)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }
    return true;
  };
}
const compareSets = /* @__PURE__ */ makeCompareSet(compareBoth);
const isEqual = (u) => hasProperty(u, symbol$1);
const asEquivalence = () => equals$1;
const make$g = (isEquivalent) => (self, that) => self === that || isEquivalent(self, that);
const isStrictEquivalent = (x, y) => x === y;
const strictEqual = () => isStrictEquivalent;
function Array$3(item) {
  return make$g((self, that) => {
    if (self.length !== that.length) return false;
    for (let i = 0; i < self.length; i++) {
      if (!item(self[i], that[i])) return false;
    }
    return true;
  });
}
const isArrayNonEmpty$1 = (self) => self.length > 0;
const symbolRedactable = /* @__PURE__ */ Symbol.for("~effect/Inspectable/redactable");
const isRedactable = (u) => hasProperty(u, symbolRedactable);
function redact$1(u) {
  if (isRedactable(u)) return getRedacted(u);
  return u;
}
function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.services ?? emptyServiceMap$1);
}
const currentFiberTypeId = "~effect/Fiber/currentFiber";
const emptyServiceMap$1 = {
  "~effect/ServiceMap": {},
  mapUnsafe: /* @__PURE__ */ new Map(),
  pipe() {
    return pipeArguments(this, arguments);
  }
};
function format(input, options) {
  const space = options?.space ?? 0;
  const seen = /* @__PURE__ */ new WeakSet();
  const gap = !space ? "" : typeof space === "number" ? " ".repeat(space) : space;
  const ind = (d) => gap.repeat(d);
  const wrap = (v, body) => {
    const ctor = v?.constructor;
    return ctor && ctor !== Object.prototype.constructor && ctor.name ? `${ctor.name}(${body})` : body;
  };
  const ownKeys = (o) => {
    try {
      return Reflect.ownKeys(o);
    } catch {
      return ["[ownKeys threw]"];
    }
  };
  function recur2(v, d = 0) {
    if (Array.isArray(v)) {
      if (seen.has(v)) return CIRCULAR;
      seen.add(v);
      if (!gap || v.length <= 1) return `[${v.map((x) => recur2(x, d)).join(",")}]`;
      const inner = v.map((x) => recur2(x, d + 1)).join(",\n" + ind(d + 1));
      return `[
${ind(d + 1)}${inner}
${ind(d)}]`;
    }
    if (v instanceof Date) return formatDate(v);
    if (!options?.ignoreToString && hasProperty(v, "toString") && typeof v["toString"] === "function" && v["toString"] !== Object.prototype.toString && v["toString"] !== Array.prototype.toString) {
      const s = safeToString(v);
      if (v instanceof Error && v.cause) {
        return `${s} (cause: ${recur2(v.cause, d)})`;
      }
      return s;
    }
    if (typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number" || v == null || typeof v === "boolean" || typeof v === "symbol") return String(v);
    if (typeof v === "bigint") return String(v) + "n";
    if (typeof v === "object" || typeof v === "function") {
      if (seen.has(v)) return CIRCULAR;
      seen.add(v);
      if (symbolRedactable in v) return format(getRedacted(v));
      if (Symbol.iterator in v) {
        return `${v.constructor.name}(${recur2(Array.from(v), d)})`;
      }
      const keys2 = ownKeys(v);
      if (!gap || keys2.length <= 1) {
        const body2 = `{${keys2.map((k) => `${formatPropertyKey(k)}:${recur2(v[k], d)}`).join(",")}}`;
        return wrap(v, body2);
      }
      const body = `{
${keys2.map((k) => `${ind(d + 1)}${formatPropertyKey(k)}: ${recur2(v[k], d + 1)}`).join(",\n")}
${ind(d)}}`;
      return wrap(v, body);
    }
    return String(v);
  }
  return recur2(input, 0);
}
const CIRCULAR = "[Circular]";
function formatPropertyKey(name) {
  return typeof name === "string" ? JSON.stringify(name) : String(name);
}
function formatPath(path) {
  return path.map((key) => `[${formatPropertyKey(key)}]`).join("");
}
function formatDate(date) {
  try {
    return date.toISOString();
  } catch {
    return "Invalid Date";
  }
}
function safeToString(input) {
  try {
    const s = input.toString();
    return typeof s === "string" ? s : String(s);
  } catch {
    return "[toString threw]";
  }
}
function formatJson(input, options) {
  let cache = [];
  const out = JSON.stringify(input, (_key, value) => typeof value === "object" && value !== null ? cache.includes(value) ? void 0 : cache.push(value) && redact$1(value) : value, options?.space);
  cache = void 0;
  return out;
}
const NodeInspectSymbol = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
const toJson = (input) => {
  try {
    if (hasProperty(input, "toJSON") && isFunction(input["toJSON"]) && input["toJSON"].length === 0) {
      return input.toJSON();
    } else if (Array.isArray(input)) {
      return input.map(toJson);
    }
  } catch {
    return "[toJSON threw]";
  }
  return redact$1(input);
};
const toStringUnknown = (u, whitespace = 2) => {
  if (typeof u === "string") {
    return u;
  }
  try {
    return typeof u === "object" ? stringifyCircular(u, whitespace) : String(u);
  } catch {
    return String(u);
  }
};
const stringifyCircular = (obj, whitespace) => {
  let cache = [];
  const retVal = JSON.stringify(obj, (_key, value) => typeof value === "object" && value !== null ? cache.includes(value) ? void 0 : cache.push(value) && redact$1(value) : value, whitespace);
  cache = void 0;
  return retVal;
};
const BaseProto = {
  toJSON() {
    return toJson(this);
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  toString() {
    return format(this.toJSON());
  }
};
class SingleShotGen {
  called = false;
  self;
  constructor(self) {
    this.self = self;
  }
  /**
   * @since 2.0.0
   */
  next(a) {
    return this.called ? {
      value: a,
      done: true
    } : (this.called = true, {
      value: this.self,
      done: false
    });
  }
  /**
   * @since 2.0.0
   */
  [Symbol.iterator]() {
    return new SingleShotGen(this.self);
  }
}
const InternalTypeId = "~effect/Effect/internal";
const standard = {
  [InternalTypeId]: (body) => {
    return body();
  }
};
const forced = {
  [InternalTypeId]: (body) => {
    try {
      return body();
    } finally {
    }
  }
};
const isNotOptimizedAway = /* @__PURE__ */ standard[InternalTypeId](() => new Error().stack)?.includes(InternalTypeId) === true;
const internalCall = isNotOptimizedAway ? standard[InternalTypeId] : forced[InternalTypeId];
const EffectTypeId = `~effect/Effect`;
const ExitTypeId = `~effect/Exit`;
const effectVariance = {
  _A: identity,
  _E: identity,
  _R: identity
};
const identifier = `${EffectTypeId}/identifier`;
const args = `${EffectTypeId}/args`;
const evaluate = `${EffectTypeId}/evaluate`;
const contA = `${EffectTypeId}/successCont`;
const contE = `${EffectTypeId}/failureCont`;
const contAll = `${EffectTypeId}/ensureCont`;
const Yield = /* @__PURE__ */ Symbol.for("effect/Effect/Yield");
const PipeInspectableProto = {
  pipe() {
    return pipeArguments(this, arguments);
  },
  toJSON() {
    return {
      ...this
    };
  },
  toString() {
    return format(this.toJSON(), {
      ignoreToString: true,
      space: 2
    });
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
};
const YieldableProto = {
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  }
};
const YieldableErrorProto = {
  ...YieldableProto,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const EffectProto = {
  [EffectTypeId]: effectVariance,
  ...PipeInspectableProto,
  [Symbol.iterator]() {
    return new SingleShotGen(this);
  },
  asEffect() {
    return this;
  },
  toJSON() {
    return {
      _id: "Effect",
      op: this[identifier],
      ...args in this ? {
        args: this[args]
      } : void 0
    };
  }
};
const isEffect$1 = (u) => hasProperty(u, EffectTypeId);
const isExit$1 = (u) => hasProperty(u, ExitTypeId);
const CauseTypeId = "~effect/Cause";
const CauseReasonTypeId = "~effect/Cause/Reason";
const isCause$1 = (self) => hasProperty(self, CauseTypeId);
const isCauseReason = (self) => hasProperty(self, CauseReasonTypeId);
class CauseImpl {
  [CauseTypeId];
  reasons;
  constructor(failures) {
    this[CauseTypeId] = CauseTypeId;
    this.reasons = failures;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toJSON() {
    return {
      _id: "Cause",
      failures: this.reasons.map((f) => f.toJSON())
    };
  }
  toString() {
    return `Cause(${format(this.reasons)})`;
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  [symbol$1](that) {
    return isCause$1(that) && this.reasons.length === that.reasons.length && this.reasons.every((e, i) => equals$1(e, that.reasons[i]));
  }
  [symbol$2]() {
    return array(this.reasons);
  }
}
const annotationsMap = /* @__PURE__ */ new WeakMap();
class ReasonBase {
  [CauseReasonTypeId];
  annotations;
  _tag;
  constructor(_tag, annotations, originalError) {
    this[CauseReasonTypeId] = CauseReasonTypeId;
    this._tag = _tag;
    if (annotations !== constEmptyAnnotations && typeof originalError === "object" && originalError !== null && annotations.size > 0) {
      const prevAnnotations = annotationsMap.get(originalError);
      if (prevAnnotations) {
        annotations = new Map([...prevAnnotations, ...annotations]);
      }
      annotationsMap.set(originalError, annotations);
    }
    this.annotations = annotations;
  }
  annotate(annotations, options) {
    if (annotations.mapUnsafe.size === 0) return this;
    const newAnnotations = new Map(this.annotations);
    annotations.mapUnsafe.forEach((value, key) => {
      if (options?.overwrite !== true && newAnnotations.has(key)) return;
      newAnnotations.set(key, value);
    });
    const self = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    self.annotations = newAnnotations;
    return self;
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toString() {
    return format(this);
  }
  [NodeInspectSymbol]() {
    return this.toString();
  }
}
const constEmptyAnnotations = /* @__PURE__ */ new Map();
class Fail extends ReasonBase {
  error;
  constructor(error, annotations = constEmptyAnnotations) {
    super("Fail", annotations, error);
    this.error = error;
  }
  toString() {
    return `Fail(${format(this.error)})`;
  }
  toJSON() {
    return {
      _tag: "Fail",
      error: this.error
    };
  }
  [symbol$1](that) {
    return isFailReason(that) && equals$1(this.error, that.error) && equals$1(this.annotations, that.annotations);
  }
  [symbol$2]() {
    return combine(string$1(this._tag))(combine(hash(this.error))(hash(this.annotations)));
  }
}
const causeFromReasons = (reasons) => new CauseImpl(reasons);
const causeEmpty = /* @__PURE__ */ new CauseImpl([]);
const causeFail = (error) => new CauseImpl([new Fail(error)]);
class Die extends ReasonBase {
  defect;
  constructor(defect, annotations = constEmptyAnnotations) {
    super("Die", annotations, defect);
    this.defect = defect;
  }
  toString() {
    return `Die(${format(this.defect)})`;
  }
  toJSON() {
    return {
      _tag: "Die",
      defect: this.defect
    };
  }
  [symbol$1](that) {
    return isDieReason(that) && equals$1(this.defect, that.defect) && equals$1(this.annotations, that.annotations);
  }
  [symbol$2]() {
    return combine(string$1(this._tag))(combine(hash(this.defect))(hash(this.annotations)));
  }
}
const causeDie = (defect) => new CauseImpl([new Die(defect)]);
const causeAnnotate = /* @__PURE__ */ dual((args2) => isCause$1(args2[0]), (self, annotations, options) => {
  if (annotations.mapUnsafe.size === 0) return self;
  return new CauseImpl(self.reasons.map((f) => f.annotate(annotations, options)));
});
const isFailReason = (self) => self._tag === "Fail";
const isDieReason = (self) => self._tag === "Die";
const isInterruptReason = (self) => self._tag === "Interrupt";
function defaultEvaluate(_fiber) {
  return exitDie(`Effect.evaluate: Not implemented`);
}
const makePrimitiveProto = (options) => ({
  ...EffectProto,
  [identifier]: options.op,
  [evaluate]: options[evaluate] ?? defaultEvaluate,
  [contA]: options[contA],
  [contE]: options[contE],
  [contAll]: options[contAll]
});
const makePrimitive = (options) => {
  const Proto2 = makePrimitiveProto(options);
  return function() {
    const self = Object.create(Proto2);
    self[args] = options.single === false ? arguments : arguments[0];
    return self;
  };
};
const makeExit = (options) => {
  const Proto2 = {
    ...makePrimitiveProto(options),
    [ExitTypeId]: ExitTypeId,
    _tag: options.op,
    get [options.prop]() {
      return this[args];
    },
    toString() {
      return `${options.op}(${format(this[args])})`;
    },
    toJSON() {
      return {
        _id: "Exit",
        _tag: options.op,
        [options.prop]: this[args]
      };
    },
    [symbol$1](that) {
      return isExit$1(that) && that._tag === this._tag && equals$1(this[args], that[args]);
    },
    [symbol$2]() {
      return combine(string$1(options.op), hash(this[args]));
    }
  };
  return function(value) {
    const self = Object.create(Proto2);
    self[args] = value;
    return self;
  };
};
const exitSucceed = /* @__PURE__ */ makeExit({
  op: "Success",
  prop: "value",
  [evaluate](fiber) {
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](this[args], fiber, this) : fiber.yieldWith(this);
  }
});
const StackTraceKey = {
  key: "effect/Cause/StackTrace"
};
const InterruptorStackTrace = {
  key: "effect/Cause/InterruptorStackTrace"
};
const exitFailCause = /* @__PURE__ */ makeExit({
  op: "Failure",
  prop: "cause",
  [evaluate](fiber) {
    let cause = this[args];
    let annotated = false;
    if (fiber.currentStackFrame) {
      cause = causeAnnotate(cause, {
        mapUnsafe: /* @__PURE__ */ new Map([[StackTraceKey.key, fiber.currentStackFrame]])
      });
      annotated = true;
    }
    let cont = fiber.getCont(contE);
    while (fiber.interruptible && fiber._interruptedCause && cont) {
      cont = fiber.getCont(contE);
    }
    return cont ? cont[contE](cause, fiber, annotated ? void 0 : this) : fiber.yieldWith(annotated ? this : exitFailCause(cause));
  }
});
const exitFail = (e) => exitFailCause(causeFail(e));
const exitDie = (defect) => exitFailCause(causeDie(defect));
const withFiber$1 = /* @__PURE__ */ makePrimitive({
  op: "WithFiber",
  [evaluate](fiber) {
    return this[args](fiber);
  }
});
const YieldableError = /* @__PURE__ */ (function() {
  class YieldableError2 extends globalThis.Error {
    asEffect() {
      return exitFail(this);
    }
  }
  Object.assign(YieldableError2.prototype, YieldableErrorProto);
  return YieldableError2;
})();
const Error$2 = /* @__PURE__ */ (function() {
  const plainArgsSymbol = /* @__PURE__ */ Symbol.for("effect/Data/Error/plainArgs");
  return class Base extends YieldableError {
    constructor(args2) {
      super(args2?.message, args2?.cause ? {
        cause: args2.cause
      } : void 0);
      if (args2) {
        Object.assign(this, args2);
        Object.defineProperty(this, plainArgsSymbol, {
          value: args2,
          enumerable: false
        });
      }
    }
    toJSON() {
      return {
        ...this[plainArgsSymbol],
        ...this
      };
    }
  };
})();
const TaggedError = (tag2) => {
  class Base3 extends Error$2 {
    _tag = tag2;
  }
  Base3.prototype.name = tag2;
  return Base3;
};
const NoSuchElementErrorTypeId = "~effect/Cause/NoSuchElementError";
class NoSuchElementError extends (/* @__PURE__ */ TaggedError("NoSuchElementError")) {
  [NoSuchElementErrorTypeId] = NoSuchElementErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
}
const DoneTypeId = "~effect/Cause/Done";
const isDone$1 = (u) => hasProperty(u, DoneTypeId);
const DoneVoid = {
  [DoneTypeId]: DoneTypeId,
  _tag: "Done",
  value: void 0
};
const Done = (value) => {
  if (value === void 0) return DoneVoid;
  return {
    [DoneTypeId]: DoneTypeId,
    _tag: "Done",
    value
  };
};
const doneVoid = /* @__PURE__ */ exitFail(DoneVoid);
const done$2 = (value) => {
  if (value === void 0) return doneVoid;
  return exitFail(Done(value));
};
const TypeId$n = "~effect/data/Option";
const CommonProto$1 = {
  [TypeId$n]: {
    _A: (_) => _
  },
  ...PipeInspectableProto,
  ...YieldableProto
};
const SomeProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto$1), {
  _tag: "Some",
  _op: "Some",
  [symbol$1](that) {
    return isOption(that) && isSome$1(that) && equals$1(this.value, that.value);
  },
  [symbol$2]() {
    return combine(hash(this._tag))(hash(this.value));
  },
  toString() {
    return `some(${format(this.value)})`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag,
      value: toJson(this.value)
    };
  },
  asEffect() {
    return exitSucceed(this.value);
  }
});
const NoneHash = /* @__PURE__ */ hash("None");
const NoneProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto$1), {
  _tag: "None",
  _op: "None",
  [symbol$1](that) {
    return isOption(that) && isNone$1(that);
  },
  [symbol$2]() {
    return NoneHash;
  },
  toString() {
    return `none()`;
  },
  toJSON() {
    return {
      _id: "Option",
      _tag: this._tag
    };
  },
  asEffect() {
    return exitFail(new NoSuchElementError());
  }
});
const isOption = (input) => hasProperty(input, TypeId$n);
const isNone$1 = (fa) => fa._tag === "None";
const isSome$1 = (fa) => fa._tag === "Some";
const none$1 = /* @__PURE__ */ Object.create(NoneProto);
const some$1 = (value) => {
  const a = Object.create(SomeProto);
  a.value = value;
  return a;
};
const TypeId$m = "~effect/data/Result";
const CommonProto = {
  [TypeId$m]: {
    /* v8 ignore next 2 */
    _A: (_) => _,
    _E: (_) => _
  },
  ...PipeInspectableProto,
  ...YieldableProto
};
const SuccessProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Success",
  _op: "Success",
  [symbol$1](that) {
    return isResult(that) && isSuccess$2(that) && equals$1(this.success, that.success);
  },
  [symbol$2]() {
    return combine(hash(this._tag))(hash(this.success));
  },
  toString() {
    return `success(${format(this.success)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      value: toJson(this.success)
    };
  },
  asEffect() {
    return exitSucceed(this.success);
  }
});
const FailureProto = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(CommonProto), {
  _tag: "Failure",
  _op: "Failure",
  [symbol$1](that) {
    return isResult(that) && isFailure$2(that) && equals$1(this.failure, that.failure);
  },
  [symbol$2]() {
    return combine(hash(this._tag))(hash(this.failure));
  },
  toString() {
    return `failure(${format(this.failure)})`;
  },
  toJSON() {
    return {
      _id: "Result",
      _tag: this._tag,
      failure: toJson(this.failure)
    };
  },
  asEffect() {
    return exitFail(this.failure);
  }
});
const isResult = (input) => hasProperty(input, TypeId$m);
const isFailure$2 = (result2) => result2._tag === "Failure";
const isSuccess$2 = (result2) => result2._tag === "Success";
const fail$4 = (failure) => {
  const a = Object.create(FailureProto);
  a.failure = failure;
  return a;
};
const succeed$5 = (success) => {
  const a = Object.create(SuccessProto);
  a.success = success;
  return a;
};
function make$f(compare) {
  return (self, that) => self === that ? 0 : compare(self, that);
}
const Number$4 = /* @__PURE__ */ make$f((self, that) => {
  if (globalThis.Number.isNaN(self) && globalThis.Number.isNaN(that)) return 0;
  if (globalThis.Number.isNaN(self)) return -1;
  if (globalThis.Number.isNaN(that)) return 1;
  return self < that ? -1 : 1;
});
const mapInput = /* @__PURE__ */ dual(2, (self, f) => make$f((b1, b2) => self(f(b1), f(b2))));
const isGreaterThan = (O) => dual(2, (self, that) => O(self, that) === 1);
const min$1 = (O) => dual(2, (self, that) => self === that || O(self, that) < 1 ? self : that);
const none = () => none$1;
const some = some$1;
const isNone = isNone$1;
const isSome = isSome$1;
const map$2 = /* @__PURE__ */ dual(2, (self, f) => isNone(self) ? none() : some(f(self.value)));
const filter = /* @__PURE__ */ dual(2, (self, predicate) => isNone(self) ? none() : predicate(self.value) ? some(self.value) : none());
const succeed$4 = succeed$5;
const fail$3 = fail$4;
const isFailure$1 = isFailure$2;
const isSuccess$1 = isSuccess$2;
const constEmpty = {
  [Symbol.iterator]() {
    return constEmptyIterator;
  }
};
const constEmptyIterator = {
  next() {
    return {
      done: true,
      value: void 0
    };
  }
};
const empty$2 = () => constEmpty;
const has$1 = /* @__PURE__ */ dual(2, (self, key) => Object.hasOwn(self, key));
const keys = (self) => Object.keys(self);
const isSubrecordBy = (equivalence) => dual(2, (self, that) => {
  for (const key of keys(self)) {
    if (!has$1(that, key) || !equivalence(self[key], that[key])) {
      return false;
    }
  }
  return true;
});
const makeEquivalence = (equivalence) => {
  const is = isSubrecordBy(equivalence);
  return (self, that) => is(self, that) && is(that, self);
};
const Array$2 = globalThis.Array;
const fromIterable = (collection) => Array$2.isArray(collection) ? collection : Array$2.from(collection);
const append$1 = /* @__PURE__ */ dual(2, (self, last) => [...self, last]);
const appendAll$1 = /* @__PURE__ */ dual(2, (self, that) => fromIterable(self).concat(fromIterable(that)));
const isArrayNonEmpty = isArrayNonEmpty$1;
const isReadonlyArrayNonEmpty = isArrayNonEmpty$1;
function isOutOfBounds(i, as2) {
  return i < 0 || i >= as2.length;
}
const getUnsafe$1 = /* @__PURE__ */ dual(2, (self, index) => {
  const i = Math.floor(index);
  if (isOutOfBounds(i, self)) {
    throw new Error(`Index out of bounds: ${i}`);
  }
  return self[i];
});
const headNonEmpty = /* @__PURE__ */ getUnsafe$1(0);
const tailNonEmpty = (self) => self.slice(1);
const unionWith = /* @__PURE__ */ dual(3, (self, that, isEquivalent) => {
  const a = fromIterable(self);
  const b = fromIterable(that);
  if (isReadonlyArrayNonEmpty(a)) {
    if (isReadonlyArrayNonEmpty(b)) {
      const dedupe = dedupeWith(isEquivalent);
      return dedupe(appendAll$1(a, b));
    }
    return a;
  }
  return b;
});
const union$1 = /* @__PURE__ */ dual(2, (self, that) => unionWith(self, that, asEquivalence()));
const dedupeWith = /* @__PURE__ */ dual(2, (self, isEquivalent) => {
  const input = fromIterable(self);
  if (isReadonlyArrayNonEmpty(input)) {
    const out = [headNonEmpty(input)];
    const rest = tailNonEmpty(input);
    for (const r of rest) {
      if (out.every((a) => !isEquivalent(r, a))) {
        out.push(r);
      }
    }
    return out;
  }
  return [];
});
const TypeId$l = "~effect/time/Duration";
const bigint0$1 = /* @__PURE__ */ BigInt(0);
const bigint1e3 = /* @__PURE__ */ BigInt(1e3);
const DURATION_REGEXP = /^(-?\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/;
const fromInputUnsafe = (input) => {
  if (isDuration(input)) return input;
  if (isNumber(input)) return millis(input);
  if (isBigInt(input)) return nanos(input);
  if (Array.isArray(input) && input.length === 2 && input.every(isNumber)) {
    if (Number.isNaN(input[0]) || Number.isNaN(input[1])) {
      return zero;
    }
    if (input[0] === -Infinity || input[1] === -Infinity) {
      return negativeInfinity;
    }
    if (input[0] === Infinity || input[1] === Infinity) {
      return infinity;
    }
    return nanos(BigInt(Math.round(input[0] * 1e9)) + BigInt(Math.round(input[1])));
  }
  if (isString(input)) {
    const match2 = DURATION_REGEXP.exec(input);
    if (match2) {
      const [_, valueStr, unit] = match2;
      const value = Number(valueStr);
      switch (unit) {
        case "nano":
        case "nanos":
          return nanos(BigInt(valueStr));
        case "micro":
        case "micros":
          return micros(BigInt(valueStr));
        case "milli":
        case "millis":
          return millis(value);
        case "second":
        case "seconds":
          return seconds(value);
        case "minute":
        case "minutes":
          return minutes(value);
        case "hour":
        case "hours":
          return hours(value);
        case "day":
        case "days":
          return days(value);
        case "week":
        case "weeks":
          return weeks(value);
      }
    }
  }
  throw new Error(`Invalid Input: ${input}`);
};
const zeroDurationValue = {
  _tag: "Millis",
  millis: 0
};
const infinityDurationValue = {
  _tag: "Infinity"
};
const negativeInfinityDurationValue = {
  _tag: "NegativeInfinity"
};
const DurationProto = {
  [TypeId$l]: TypeId$l,
  [symbol$2]() {
    return structure(this.value);
  },
  [symbol$1](that) {
    return isDuration(that) && equals(this, that);
  },
  toString() {
    switch (this.value._tag) {
      case "Infinity":
        return "Infinity";
      case "NegativeInfinity":
        return "-Infinity";
      case "Nanos":
        return `${this.value.nanos} nanos`;
      case "Millis":
        return `${this.value.millis} millis`;
    }
  },
  toJSON() {
    switch (this.value._tag) {
      case "Millis":
        return {
          _id: "Duration",
          _tag: "Millis",
          millis: this.value.millis
        };
      case "Nanos":
        return {
          _id: "Duration",
          _tag: "Nanos",
          nanos: String(this.value.nanos)
        };
      case "Infinity":
        return {
          _id: "Duration",
          _tag: "Infinity"
        };
      case "NegativeInfinity":
        return {
          _id: "Duration",
          _tag: "NegativeInfinity"
        };
    }
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const make$e = (input) => {
  const duration = Object.create(DurationProto);
  if (isNumber(input)) {
    if (isNaN(input) || input === 0 || Object.is(input, -0)) {
      duration.value = zeroDurationValue;
    } else if (!Number.isFinite(input)) {
      duration.value = input > 0 ? infinityDurationValue : negativeInfinityDurationValue;
    } else if (!Number.isInteger(input)) {
      duration.value = {
        _tag: "Nanos",
        nanos: BigInt(Math.round(input * 1e6))
      };
    } else {
      duration.value = {
        _tag: "Millis",
        millis: input
      };
    }
  } else if (input === bigint0$1) {
    duration.value = zeroDurationValue;
  } else {
    duration.value = {
      _tag: "Nanos",
      nanos: input
    };
  }
  return duration;
};
const isDuration = (u) => hasProperty(u, TypeId$l);
const zero = /* @__PURE__ */ make$e(0);
const infinity = /* @__PURE__ */ make$e(Infinity);
const negativeInfinity = /* @__PURE__ */ make$e(-Infinity);
const nanos = (nanos2) => make$e(nanos2);
const micros = (micros2) => make$e(micros2 * bigint1e3);
const millis = (millis2) => make$e(millis2);
const seconds = (seconds2) => make$e(seconds2 * 1e3);
const minutes = (minutes2) => make$e(minutes2 * 6e4);
const hours = (hours2) => make$e(hours2 * 36e5);
const days = (days2) => make$e(days2 * 864e5);
const weeks = (weeks2) => make$e(weeks2 * 6048e5);
const toMillis = (self) => match$1(self, {
  onMillis: identity,
  onNanos: (nanos2) => Number(nanos2) / 1e6,
  onInfinity: () => Infinity,
  onNegativeInfinity: () => -Infinity
});
const toNanosUnsafe = (self) => {
  switch (self.value._tag) {
    case "Infinity":
    case "NegativeInfinity":
      throw new Error("Cannot convert infinite duration to nanos");
    case "Nanos":
      return self.value.nanos;
    case "Millis":
      return BigInt(Math.round(self.value.millis * 1e6));
  }
};
const match$1 = /* @__PURE__ */ dual(2, (self, options) => {
  switch (self.value._tag) {
    case "Millis":
      return options.onMillis(self.value.millis);
    case "Nanos":
      return options.onNanos(self.value.nanos);
    case "Infinity":
      return options.onInfinity();
    case "NegativeInfinity":
      return (options.onNegativeInfinity ?? options.onInfinity)();
  }
});
const matchPair = /* @__PURE__ */ dual(3, (self, that, options) => {
  if (self.value._tag === "Infinity" || self.value._tag === "NegativeInfinity" || that.value._tag === "Infinity" || that.value._tag === "NegativeInfinity") return options.onInfinity(self, that);
  if (self.value._tag === "Millis") {
    return that.value._tag === "Millis" ? options.onMillis(self.value.millis, that.value.millis) : options.onNanos(toNanosUnsafe(self), that.value.nanos);
  } else {
    return options.onNanos(self.value.nanos, toNanosUnsafe(that));
  }
});
const Order = /* @__PURE__ */ make$f((self, that) => matchPair(self, that, {
  onMillis: (self2, that2) => self2 < that2 ? -1 : self2 > that2 ? 1 : 0,
  onNanos: (self2, that2) => self2 < that2 ? -1 : self2 > that2 ? 1 : 0,
  onInfinity: (self2, that2) => {
    if (self2.value._tag === that2.value._tag) return 0;
    if (self2.value._tag === "Infinity") return 1;
    if (self2.value._tag === "NegativeInfinity") return -1;
    if (that2.value._tag === "Infinity") return -1;
    return 1;
  }
}));
const Equivalence$1 = (self, that) => matchPair(self, that, {
  onMillis: (self2, that2) => self2 === that2,
  onNanos: (self2, that2) => self2 === that2,
  onInfinity: (self2, that2) => self2.value._tag === that2.value._tag
});
const min = /* @__PURE__ */ min$1(Order);
const equals = /* @__PURE__ */ dual(2, (self, that) => Equivalence$1(self, that));
const toPredicate = (self) => (input) => !isFailure$1(self(input));
const has = (key) => (input) => input.has(key) ? succeed$4(input) : fail$3(input);
const compose = /* @__PURE__ */ dual(2, (left, right) => (input) => {
  const leftOut = left(input);
  if (isFailure$1(leftOut)) return leftOut;
  return right(leftOut.success);
});
const composePassthrough = /* @__PURE__ */ dual(2, (left, right) => (input) => {
  const leftOut = left(input);
  if (isFailure$1(leftOut)) return fail$3(input);
  const rightOut = right(leftOut.success);
  if (isFailure$1(rightOut)) return fail$3(input);
  return rightOut;
});
const ServiceTypeId = "~effect/ServiceMap/Service";
const Service = function() {
  const prevLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 2;
  const err = new Error();
  Error.stackTraceLimit = prevLimit;
  function KeyClass() {
  }
  const self = KeyClass;
  Object.setPrototypeOf(self, ServiceProto);
  Object.defineProperty(self, "stack", {
    get() {
      return err.stack;
    }
  });
  if (arguments.length > 0) {
    self.key = arguments[0];
    if (arguments[1]?.defaultValue) {
      self[ReferenceTypeId] = ReferenceTypeId;
      self.defaultValue = arguments[1].defaultValue;
    }
    return self;
  }
  return function(key, options) {
    self.key = key;
    if (options?.make) {
      self.make = options.make;
    }
    return self;
  };
};
const ServiceProto = {
  [ServiceTypeId]: {
    _Service: (_) => _,
    _Identifier: (_) => _
  },
  ...PipeInspectableProto,
  ...YieldableProto,
  toJSON() {
    return {
      _id: "Service",
      key: this.key,
      stack: this.stack
    };
  },
  asEffect() {
    const fn = this.asEffect = constant(withFiber$1((fiber) => exitSucceed(get(fiber.services, this))));
    return fn();
  },
  of(self) {
    return self;
  },
  serviceMap(self) {
    return make$d(this, self);
  },
  use(f) {
    return withFiber$1((fiber) => f(get(fiber.services, this)));
  },
  useSync(f) {
    return withFiber$1((fiber) => exitSucceed(f(get(fiber.services, this))));
  }
};
const ReferenceTypeId = "~effect/ServiceMap/Reference";
const TypeId$k = "~effect/ServiceMap";
const makeUnsafe$6 = (mapUnsafe) => {
  const self = Object.create(Proto$4);
  self.mapUnsafe = mapUnsafe;
  return self;
};
const Proto$4 = {
  ...PipeInspectableProto,
  [TypeId$k]: {
    _Services: (_) => _
  },
  toJSON() {
    return {
      _id: "ServiceMap",
      services: Array.from(this.mapUnsafe).map(([key, value]) => ({
        key,
        value
      }))
    };
  },
  [symbol$1](that) {
    if (!isServiceMap(that) || this.mapUnsafe.size !== that.mapUnsafe.size) return false;
    for (const k of this.mapUnsafe.keys()) {
      if (!that.mapUnsafe.has(k) || !equals$1(this.mapUnsafe.get(k), that.mapUnsafe.get(k))) {
        return false;
      }
    }
    return true;
  },
  [symbol$2]() {
    return number$1(this.mapUnsafe.size);
  }
};
const isServiceMap = (u) => hasProperty(u, TypeId$k);
const isReference = (u) => hasProperty(u, ReferenceTypeId);
const empty$1 = () => emptyServiceMap;
const emptyServiceMap = /* @__PURE__ */ makeUnsafe$6(/* @__PURE__ */ new Map());
const make$d = (key, service) => makeUnsafe$6(/* @__PURE__ */ new Map([[key.key, service]]));
const add = /* @__PURE__ */ dual(3, (self, key, service) => {
  const map2 = new Map(self.mapUnsafe);
  map2.set(key.key, service);
  return makeUnsafe$6(map2);
});
const getOrElse = /* @__PURE__ */ dual(3, (self, key, orElse) => {
  if (self.mapUnsafe.has(key.key)) {
    return self.mapUnsafe.get(key.key);
  }
  return isReference(key) ? getDefaultValue(key) : orElse();
});
const getUnsafe = /* @__PURE__ */ dual(2, (self, service) => {
  if (!self.mapUnsafe.has(service.key)) {
    if (ReferenceTypeId in service) return getDefaultValue(service);
    throw serviceNotFoundError(service);
  }
  return self.mapUnsafe.get(service.key);
});
const get = getUnsafe;
const getReferenceUnsafe = (self, service) => {
  if (!self.mapUnsafe.has(service.key)) {
    return getDefaultValue(service);
  }
  return self.mapUnsafe.get(service.key);
};
const defaultValueCacheKey = "~effect/ServiceMap/defaultValue";
const getDefaultValue = (ref) => {
  if (defaultValueCacheKey in ref) {
    return ref[defaultValueCacheKey];
  }
  return ref[defaultValueCacheKey] = ref.defaultValue();
};
const serviceNotFoundError = (service) => {
  const error = new Error(`Service not found${service.key ? `: ${String(service.key)}` : ""}`);
  if (service.stack) {
    const lines = service.stack.split("\n");
    if (lines.length > 2) {
      const afterAt = lines[2].match(/at (.*)/);
      if (afterAt) {
        error.message = error.message + ` (defined at ${afterAt[1]})`;
      }
    }
  }
  if (error.stack) {
    const lines = error.stack.split("\n");
    lines.splice(1, 3);
    error.stack = lines.join("\n");
  }
  return error;
};
const merge$1 = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.mapUnsafe.size === 0) return that;
  if (that.mapUnsafe.size === 0) return self;
  const map2 = new Map(self.mapUnsafe);
  that.mapUnsafe.forEach((value, key) => map2.set(key, value));
  return makeUnsafe$6(map2);
});
const mergeAll$1 = (...ctxs) => {
  const map2 = /* @__PURE__ */ new Map();
  for (let i = 0; i < ctxs.length; i++) {
    ctxs[i].mapUnsafe.forEach((value, key) => {
      map2.set(key, value);
    });
  }
  return makeUnsafe$6(map2);
};
const Reference = Service;
const Scheduler = /* @__PURE__ */ Reference("effect/Scheduler", {
  defaultValue: () => new MixedScheduler()
});
const setImmediate = "setImmediate" in globalThis ? (f) => {
  const timer = globalThis.setImmediate(f);
  return () => globalThis.clearImmediate(timer);
} : (f) => {
  const timer = setTimeout(f, 0);
  return () => clearTimeout(timer);
};
class PriorityBuckets {
  buckets = [];
  scheduleTask(task, priority) {
    const buckets = this.buckets;
    const len = buckets.length;
    let bucket;
    let index = 0;
    for (; index < len; index++) {
      if (buckets[index][0] > priority) break;
      bucket = buckets[index];
    }
    if (bucket && bucket[0] === priority) {
      bucket[1].push(task);
    } else if (index === len) {
      buckets.push([priority, [task]]);
    } else {
      buckets.splice(index, 0, [priority, [task]]);
    }
  }
  drain() {
    const buckets = this.buckets;
    this.buckets = [];
    return buckets;
  }
}
class MixedScheduler {
  tasks = /* @__PURE__ */ new PriorityBuckets();
  running = void 0;
  executionMode;
  setImmediate;
  constructor(executionMode = "async", setImmediateFn = setImmediate) {
    this.executionMode = executionMode;
    this.setImmediate = setImmediateFn;
  }
  /**
   * @since 2.0.0
   */
  scheduleTask(task, priority) {
    this.tasks.scheduleTask(task, priority);
    if (this.running === void 0) {
      this.running = this.setImmediate(this.afterScheduled);
    }
  }
  /**
   * @since 2.0.0
   */
  afterScheduled = () => {
    this.running = void 0;
    this.runTasks();
  };
  /**
   * @since 2.0.0
   */
  runTasks() {
    const buckets = this.tasks.drain();
    for (let i = 0; i < buckets.length; i++) {
      const toRun = buckets[i][1];
      for (let j = 0; j < toRun.length; j++) {
        toRun[j]();
      }
    }
  }
  /**
   * @since 2.0.0
   */
  shouldYield(fiber) {
    return fiber.currentOpCount >= fiber.maxOpsBeforeYield;
  }
  /**
   * @since 2.0.0
   */
  flush() {
    while (this.tasks.buckets.length > 0) {
      if (this.running !== void 0) {
        this.running();
        this.running = void 0;
      }
      this.runTasks();
    }
  }
}
const MaxOpsBeforeYield = /* @__PURE__ */ Reference("effect/Scheduler/MaxOpsBeforeYield", {
  defaultValue: () => 2048
});
const ParentSpanKey = "effect/Tracer/ParentSpan";
class ParentSpan extends (/* @__PURE__ */ Service()(ParentSpanKey)) {
}
const make$c = (options) => options;
const DisablePropagation = /* @__PURE__ */ Reference("effect/Tracer/DisablePropagation", {
  defaultValue: constFalse
});
const CurrentTraceLevel = /* @__PURE__ */ Reference("effect/Tracer/CurrentTraceLevel", {
  defaultValue: () => "Info"
});
const MinimumTraceLevel = /* @__PURE__ */ Reference("effect/Tracer/MinimumTraceLevel", {
  defaultValue: () => "All"
});
const TracerKey = "effect/Tracer";
const Tracer = /* @__PURE__ */ Reference(TracerKey, {
  defaultValue: () => make$c({
    span: (options) => new NativeSpan(options)
  })
});
class NativeSpan {
  _tag = "Span";
  spanId;
  traceId = "native";
  sampled;
  name;
  parent;
  annotations;
  links;
  startTime;
  kind;
  status;
  attributes;
  events = [];
  constructor(options) {
    this.name = options.name;
    this.parent = options.parent;
    this.annotations = options.annotations;
    this.links = options.links;
    this.startTime = options.startTime;
    this.kind = options.kind;
    this.sampled = options.sampled;
    this.status = {
      _tag: "Started",
      startTime: options.startTime
    };
    this.attributes = /* @__PURE__ */ new Map();
    this.traceId = options.parent?.traceId ?? randomHexString(32);
    this.spanId = randomHexString(16);
  }
  end(endTime, exit2) {
    this.status = {
      _tag: "Ended",
      endTime,
      exit: exit2,
      startTime: this.status.startTime
    };
  }
  attribute(key, value) {
    this.attributes.set(key, value);
  }
  event(name, startTime, attributes) {
    this.events.push([name, startTime, attributes ?? {}]);
  }
  addLinks(links) {
    this.links.push(...links);
  }
}
const randomHexString = /* @__PURE__ */ (function() {
  const characters = "abcdef0123456789";
  const charactersLength = characters.length;
  return function(length) {
    let result2 = "";
    for (let i = 0; i < length; i++) {
      result2 += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result2;
  };
})();
const CurrentConcurrency = /* @__PURE__ */ Reference("effect/References/CurrentConcurrency", {
  defaultValue: () => "unbounded"
});
const CurrentStackFrame = /* @__PURE__ */ Reference("effect/References/CurrentStackFrame", {
  defaultValue: constUndefined
});
const TracerEnabled = /* @__PURE__ */ Reference("effect/References/TracerEnabled", {
  defaultValue: constTrue
});
const TracerTimingEnabled = /* @__PURE__ */ Reference("effect/References/TracerTimingEnabled", {
  defaultValue: constTrue
});
const TracerSpanAnnotations = /* @__PURE__ */ Reference("effect/References/TracerSpanAnnotations", {
  defaultValue: () => ({})
});
const TracerSpanLinks = /* @__PURE__ */ Reference("effect/References/TracerSpanLinks", {
  defaultValue: () => []
});
const CurrentLogAnnotations = /* @__PURE__ */ Reference("effect/References/CurrentLogAnnotations", {
  defaultValue: () => ({})
});
const CurrentLogLevel = /* @__PURE__ */ Reference("effect/References/CurrentLogLevel", {
  defaultValue: () => "Info"
});
const MinimumLogLevel = /* @__PURE__ */ Reference("effect/References/MinimumLogLevel", {
  defaultValue: () => "Info"
});
const CurrentLogSpans = /* @__PURE__ */ Reference("effect/References/CurrentLogSpans", {
  defaultValue: () => []
});
const FiberRuntimeMetricsKey = "effect/observability/Metric/FiberRuntimeMetricsKey";
const addSpanStackTrace = (options) => {
  if (options?.captureStackTrace === false) {
    return options;
  } else if (options?.captureStackTrace !== void 0 && typeof options.captureStackTrace !== "boolean") {
    return options;
  }
  const limit = Error.stackTraceLimit;
  Error.stackTraceLimit = 3;
  const traceError = new Error();
  Error.stackTraceLimit = limit;
  return {
    ...options,
    captureStackTrace: spanCleaner(() => traceError.stack)
  };
};
const makeStackCleaner = (line) => (stack) => {
  let cache;
  return () => {
    if (cache !== void 0) return cache;
    const trace = stack();
    if (!trace) return void 0;
    const lines = trace.split("\n");
    if (lines[line] !== void 0) {
      cache = lines[line].trim();
      return cache;
    }
  };
};
const spanCleaner = /* @__PURE__ */ makeStackCleaner(3);
const version = "dev";
class Interrupt extends ReasonBase {
  fiberId;
  constructor(fiberId, annotations = constEmptyAnnotations) {
    super("Interrupt", annotations, "Interrupted");
    this.fiberId = fiberId;
  }
  toString() {
    return `Interrupt(${this.fiberId})`;
  }
  toJSON() {
    return {
      _tag: "Interrupt",
      fiberId: this.fiberId
    };
  }
  [symbol$1](that) {
    return isInterruptReason(that) && this.fiberId === that.fiberId && this.annotations === that.annotations;
  }
  [symbol$2]() {
    return combine(string$1(`${this._tag}:${this.fiberId}`))(random(this.annotations));
  }
}
const makeInterruptReason$1 = (fiberId) => new Interrupt(fiberId);
const causeInterrupt = (fiberId) => new CauseImpl([new Interrupt(fiberId)]);
const findFail = (self) => {
  const reason = self.reasons.find(isFailReason);
  return reason ? succeed$4(reason) : fail$3(self);
};
const findError$1 = (self) => {
  for (let i = 0; i < self.reasons.length; i++) {
    const reason = self.reasons[i];
    if (reason._tag === "Fail") {
      return succeed$4(reason.error);
    }
  }
  return fail$3(self);
};
const hasInterrupts = (self) => self.reasons.some(isInterruptReason);
const causeFilterInterruptors = (self) => {
  let interruptors2;
  for (let i = 0; i < self.reasons.length; i++) {
    const f = self.reasons[i];
    if (f._tag !== "Interrupt") continue;
    interruptors2 ??= /* @__PURE__ */ new Set();
    if (f.fiberId !== void 0) {
      interruptors2.add(f.fiberId);
    }
  }
  return interruptors2 ? succeed$4(interruptors2) : fail$3(self);
};
const causeInterruptors = (self) => {
  const result2 = causeFilterInterruptors(self);
  return isFailure$1(result2) ? emptySet : result2.success;
};
const emptySet = /* @__PURE__ */ new Set();
const hasInterruptsOnly$1 = (self) => self.reasons.every(isInterruptReason);
const causeCombine = /* @__PURE__ */ dual(2, (self, that) => {
  if (self.reasons.length === 0) {
    return that;
  } else if (that.reasons.length === 0) {
    return self;
  }
  const newCause = new CauseImpl(union$1(self.reasons, that.reasons));
  return equals$1(self, newCause) ? self : newCause;
});
const causePartition = (self) => {
  const obj = {
    Fail: [],
    Die: [],
    Interrupt: []
  };
  for (let i = 0; i < self.reasons.length; i++) {
    obj[self.reasons[i]._tag].push(self.reasons[i]);
  }
  return obj;
};
const causeSquash = (self) => {
  const partitioned = causePartition(self);
  if (partitioned.Fail.length > 0) {
    return partitioned.Fail[0].error;
  } else if (partitioned.Die.length > 0) {
    return partitioned.Die[0].defect;
  } else if (partitioned.Interrupt.length > 0) {
    return new globalThis.Error("All fibers interrupted without error");
  }
  return new globalThis.Error("Empty cause");
};
const causePrettyErrors = (self) => {
  const errors = [];
  const interrupts = [];
  if (self.reasons.length === 0) return errors;
  const prevStackLimit = Error.stackTraceLimit;
  Error.stackTraceLimit = 1;
  for (const failure of self.reasons) {
    if (failure._tag === "Interrupt") {
      interrupts.push(failure);
      continue;
    }
    errors.push(causePrettyError(failure._tag === "Die" ? failure.defect : failure.error, failure.annotations));
  }
  if (errors.length === 0) {
    const cause = new Error("The fiber was interrupted by:");
    cause.name = "InterruptCause";
    cause.stack = interruptCauseStack(cause, interrupts);
    const error = new globalThis.Error("All fibers interrupted without error", {
      cause
    });
    error.name = "InterruptError";
    error.stack = `${error.name}: ${error.message}`;
    errors.push(causePrettyError(error, interrupts[0].annotations));
  }
  Error.stackTraceLimit = prevStackLimit;
  return errors;
};
const causePrettyError = (original, annotations) => {
  const kind = typeof original;
  let error;
  if (original && kind === "object") {
    error = new globalThis.Error(causePrettyMessage(original), {
      cause: original.cause ? causePrettyError(original.cause) : void 0
    });
    if (typeof original.name === "string") {
      error.name = original.name;
    }
    if (typeof original.stack === "string") {
      error.stack = cleanErrorStack(original.stack, error, annotations);
    } else {
      const stack = `${error.name}: ${error.message}`;
      error.stack = annotations ? addStackAnnotations(stack, annotations) : stack;
    }
    for (const key of Object.keys(original)) {
      if (!(key in error)) {
        error[key] = original[key];
      }
    }
  } else {
    error = new globalThis.Error(!original ? `Unknown error: ${original}` : kind === "string" ? original : formatJson(original));
  }
  return error;
};
const causePrettyMessage = (u) => {
  if (typeof u.message === "string") {
    return u.message;
  } else if (typeof u.toString === "function" && u.toString !== Object.prototype.toString && u.toString !== Array.prototype.toString) {
    try {
      return u.toString();
    } catch {
    }
  }
  return formatJson(u);
};
const locationRegExp = /\((.*)\)/g;
const cleanErrorStack = (stack, error, annotations) => {
  const message = `${error.name}: ${error.message}`;
  const lines = (stack.startsWith(message) ? stack.slice(message.length) : stack).split("\n");
  const out = [message];
  for (let i = 1; i < lines.length; i++) {
    if (/(?:Generator\.next|~effect\/Effect)/.test(lines[i])) {
      break;
    }
    out.push(lines[i]);
  }
  return annotations ? addStackAnnotations(out.join("\n"), annotations) : out.join("\n");
};
const addStackAnnotations = (stack, annotations) => {
  const frame = annotations?.get(StackTraceKey.key);
  if (frame) {
    stack = `${stack}
${currentStackTrace(frame)}`;
  }
  return stack;
};
const interruptCauseStack = (error, interrupts) => {
  const out = [`${error.name}: ${error.message}`];
  for (const current of interrupts) {
    const fiberId = current.fiberId !== void 0 ? `#${current.fiberId}` : "unknown";
    const frame = current.annotations.get(InterruptorStackTrace.key);
    out.push(`    at fiber (${fiberId})`);
    if (frame) out.push(currentStackTrace(frame));
  }
  return out.join("\n");
};
const currentStackTrace = (frame) => {
  const out = [];
  let current = frame;
  let i = 0;
  while (current && i < 10) {
    const stack = current.stack();
    if (stack) {
      const locationMatchAll = stack.matchAll(locationRegExp);
      let match2 = false;
      for (const [, location] of locationMatchAll) {
        match2 = true;
        out.push(`    at ${current.name} (${location})`);
      }
      if (!match2) {
        out.push(`    at ${current.name} (${stack.replace(/^at /, "")})`);
      }
    } else {
      out.push(`    at ${current.name}`);
    }
    current = current.parent;
    i++;
  }
  return out.join("\n");
};
const causePretty = (cause) => causePrettyErrors(cause).map((e) => e.cause ? `${e.stack} {
${renderErrorCause(e.cause, "  ")}
}` : e.stack).join("\n");
const renderErrorCause = (cause, prefix) => {
  const lines = cause.stack.split("\n");
  let stack = `${prefix}[cause]: ${lines[0]}`;
  for (let i = 1, len = lines.length; i < len; i++) {
    stack += `
${prefix}${lines[i]}`;
  }
  if (cause.cause) {
    stack += ` {
${renderErrorCause(cause.cause, `${prefix}  `)}
${prefix}}`;
  }
  return stack;
};
const FiberTypeId = `~effect/Fiber/${version}`;
const fiberVariance = {
  _A: identity,
  _E: identity
};
const fiberIdStore = {
  id: 0
};
const getCurrentFiber = () => globalThis[currentFiberTypeId];
class FiberImpl {
  constructor(services2, interruptible2 = true) {
    this[FiberTypeId] = fiberVariance;
    this.setServices(services2);
    this.id = ++fiberIdStore.id;
    this.currentOpCount = 0;
    this.currentLoopCount = 0;
    this.interruptible = interruptible2;
    this._stack = [];
    this._observers = [];
    this._exit = void 0;
    this._children = void 0;
    this._interruptedCause = void 0;
    this._yielded = void 0;
  }
  [FiberTypeId];
  id;
  interruptible;
  currentOpCount;
  currentLoopCount;
  _stack;
  _observers;
  _exit;
  _currentExit;
  _children;
  _interruptedCause;
  _yielded;
  // set in setServices
  services;
  currentScheduler;
  currentTracerContext;
  currentSpan;
  currentLogLevel;
  minimumLogLevel;
  currentStackFrame;
  runtimeMetrics;
  maxOpsBeforeYield;
  getRef(ref) {
    return getReferenceUnsafe(this.services, ref);
  }
  addObserver(cb) {
    if (this._exit) {
      cb(this._exit);
      return constVoid;
    }
    this._observers.push(cb);
    return () => {
      const index = this._observers.indexOf(cb);
      if (index >= 0) {
        this._observers.splice(index, 1);
      }
    };
  }
  interruptUnsafe(fiberId, annotations) {
    if (this._exit) {
      return;
    }
    let cause = causeInterrupt(fiberId);
    if (this.currentStackFrame) {
      cause = causeAnnotate(cause, make$d(StackTraceKey, this.currentStackFrame));
    }
    if (annotations) {
      cause = causeAnnotate(cause, annotations);
    }
    this._interruptedCause = this._interruptedCause ? causeCombine(this._interruptedCause, cause) : cause;
    if (this.interruptible) {
      this.evaluate(failCause$3(this._interruptedCause));
    }
  }
  pollUnsafe() {
    return this._exit;
  }
  evaluate(effect2) {
    this.runtimeMetrics?.recordFiberStart(this.services);
    if (this._exit) {
      return;
    } else if (this._yielded !== void 0) {
      const yielded = this._yielded;
      this._yielded = void 0;
      yielded();
    }
    const exit2 = this.runLoop(effect2);
    if (exit2 === Yield) {
      return;
    }
    this._exit = exit2;
    this.runtimeMetrics?.recordFiberEnd(this.services, this._exit);
    for (let i = 0; i < this._observers.length; i++) {
      this._observers[i](exit2);
    }
    this._observers.length = 0;
  }
  runLoop(effect2) {
    const prevFiber = globalThis[currentFiberTypeId];
    globalThis[currentFiberTypeId] = this;
    let yielding = false;
    let current = effect2;
    this.currentOpCount = 0;
    const currentLoop = ++this.currentLoopCount;
    try {
      while (true) {
        this.currentOpCount++;
        if (!yielding && this.currentScheduler.shouldYield(this)) {
          yielding = true;
          const prev = current;
          current = flatMap$1(yieldNow, () => prev);
        }
        current = this.currentTracerContext ? this.currentTracerContext(current, this) : current[evaluate](this);
        if (currentLoop !== this.currentLoopCount) {
          return Yield;
        } else if (current === Yield) {
          const yielded = this._yielded;
          if (ExitTypeId in yielded) {
            this._yielded = void 0;
            return yielded;
          }
          return Yield;
        }
      }
    } catch (error) {
      if (!hasProperty(current, evaluate)) {
        return exitDie(`Fiber.runLoop: Not a valid effect: ${String(current)}`);
      }
      return this.runLoop(exitDie(error));
    } finally {
      globalThis[currentFiberTypeId] = prevFiber;
    }
  }
  getCont(symbol2) {
    while (true) {
      const op = this._stack.pop();
      if (!op) return void 0;
      const cont = op[contAll] && op[contAll](this);
      if (cont) {
        cont[symbol2] = cont;
        return cont;
      }
      if (op[symbol2]) return op;
    }
  }
  yieldWith(value) {
    this._yielded = value;
    return Yield;
  }
  children() {
    return this._children ??= /* @__PURE__ */ new Set();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  setServices(services2) {
    this.services = services2;
    this.currentScheduler = this.getRef(Scheduler);
    this.currentSpan = services2.mapUnsafe.get(ParentSpanKey);
    this.currentLogLevel = this.getRef(CurrentLogLevel);
    this.minimumLogLevel = this.getRef(MinimumLogLevel);
    this.currentStackFrame = services2.mapUnsafe.get(CurrentStackFrame.key);
    this.maxOpsBeforeYield = this.getRef(MaxOpsBeforeYield);
    this.runtimeMetrics = services2.mapUnsafe.get(FiberRuntimeMetricsKey);
    const currentTracer = services2.mapUnsafe.get(TracerKey);
    this.currentTracerContext = currentTracer ? currentTracer["context"] : void 0;
  }
  get currentSpanLocal() {
    return this.currentSpan?._tag === "Span" ? this.currentSpan : void 0;
  }
}
const fiberStackAnnotations = (fiber) => {
  if (!fiber.currentStackFrame) return void 0;
  const annotations = /* @__PURE__ */ new Map();
  annotations.set(StackTraceKey.key, fiber.currentStackFrame);
  return makeUnsafe$6(annotations);
};
const fiberAwait = (self) => {
  const impl = self;
  if (impl._exit) return succeed$3(impl._exit);
  return callback$1((resume) => {
    if (impl._exit) return resume(succeed$3(impl._exit));
    return sync$1(self.addObserver((exit2) => resume(succeed$3(exit2))));
  });
};
const fiberAwaitAll = (self) => callback$1((resume) => {
  const iter = self[Symbol.iterator]();
  const exits = [];
  let cancel = void 0;
  function loop() {
    let result2 = iter.next();
    while (!result2.done) {
      if (result2.value._exit) {
        exits.push(result2.value._exit);
        result2 = iter.next();
        continue;
      }
      cancel = result2.value.addObserver((exit2) => {
        exits.push(exit2);
        loop();
      });
      return;
    }
    resume(succeed$3(exits));
  }
  loop();
  return sync$1(() => cancel?.());
});
const fiberInterrupt = (self) => withFiber$1((fiber) => fiberInterruptAs(self, fiber.id));
const fiberInterruptAs = /* @__PURE__ */ dual((args2) => hasProperty(args2[0], FiberTypeId), (self, fiberId, annotations) => withFiber$1((parent) => {
  let ann = fiberStackAnnotations(parent);
  ann = ann && annotations ? merge$1(ann, annotations) : ann ?? annotations;
  self.interruptUnsafe(fiberId, ann);
  return asVoid(fiberAwait(self));
}));
const fiberInterruptAll = (fibers) => withFiber$1((parent) => {
  const annotations = fiberStackAnnotations(parent);
  for (const fiber of fibers) {
    fiber.interruptUnsafe(parent.id, annotations);
  }
  return asVoid(fiberAwaitAll(fibers));
});
const succeed$3 = exitSucceed;
const failCause$3 = exitFailCause;
const fail$2 = exitFail;
const sync$1 = /* @__PURE__ */ makePrimitive({
  op: "Sync",
  [evaluate](fiber) {
    const value = this[args]();
    const cont = fiber.getCont(contA);
    return cont ? cont[contA](value, fiber) : fiber.yieldWith(exitSucceed(value));
  }
});
const suspend$1 = /* @__PURE__ */ makePrimitive({
  op: "Suspend",
  [evaluate](_fiber) {
    return this[args]();
  }
});
const yieldNowWith = /* @__PURE__ */ makePrimitive({
  op: "Yield",
  [evaluate](fiber) {
    let resumed = false;
    fiber.currentScheduler.scheduleTask(() => {
      if (resumed) return;
      fiber.evaluate(exitVoid);
    }, this[args] ?? 0);
    return fiber.yieldWith(() => {
      resumed = true;
    });
  }
});
const yieldNow = /* @__PURE__ */ yieldNowWith(0);
const succeedSome$1 = (a) => succeed$3(some(a));
const succeedNone$1 = /* @__PURE__ */ succeed$3(/* @__PURE__ */ none());
const die$1 = (defect) => exitDie(defect);
const failSync = (error) => suspend$1(() => fail$2(internalCall(error)));
const void_$2 = /* @__PURE__ */ succeed$3(void 0);
const promise$1 = (evaluate2) => callbackOptions(function(resume, signal) {
  internalCall(() => evaluate2(signal)).then((a) => resume(succeed$3(a)), (e) => resume(die$1(e)));
}, evaluate2.length !== 0);
const withFiberId = (f) => withFiber$1((fiber) => f(fiber.id));
const callbackOptions = /* @__PURE__ */ makePrimitive({
  op: "Async",
  single: false,
  [evaluate](fiber) {
    const register = internalCall(() => this[args][0].bind(fiber.currentScheduler));
    let resumed = false;
    let yielded = false;
    const controller = this[args][1] ? new AbortController() : void 0;
    const onCancel = register((effect2) => {
      if (resumed) return;
      resumed = true;
      if (yielded) {
        fiber.evaluate(effect2);
      } else {
        yielded = effect2;
      }
    }, controller?.signal);
    if (yielded !== false) return yielded;
    yielded = true;
    fiber._yielded = () => {
      resumed = true;
    };
    if (controller === void 0 && onCancel === void 0) {
      return Yield;
    }
    fiber._stack.push(asyncFinalizer(() => {
      resumed = true;
      controller?.abort();
      return onCancel ?? exitVoid;
    }));
    return Yield;
  }
});
const asyncFinalizer = /* @__PURE__ */ makePrimitive({
  op: "AsyncFinalizer",
  [contAll](fiber) {
    if (fiber.interruptible) {
      fiber.interruptible = false;
      fiber._stack.push(setInterruptibleTrue);
    }
  },
  [contE](cause, _fiber) {
    return hasInterrupts(cause) ? flatMap$1(this[args](), () => failCause$3(cause)) : failCause$3(cause);
  }
});
const callback$1 = (register) => callbackOptions(register, register.length >= 2);
const never$2 = /* @__PURE__ */ callback$1(constVoid);
const gen$1 = (...args2) => suspend$1(() => fromIteratorUnsafe(args2.length === 1 ? args2[0]() : args2[1].call(args2[0].self)));
const fnUntraced$1 = (body, ...pipeables) => {
  const fn = pipeables.length === 0 ? function() {
    return suspend$1(() => fromIteratorUnsafe(body.apply(this, arguments)));
  } : function() {
    let effect2 = suspend$1(() => fromIteratorUnsafe(body.apply(this, arguments)));
    for (let i = 0; i < pipeables.length; i++) {
      effect2 = pipeables[i](effect2, ...arguments);
    }
    return effect2;
  };
  return defineFunctionLength(body.length, fn);
};
const defineFunctionLength = (length, fn) => Object.defineProperty(fn, "length", {
  value: length,
  configurable: true
});
const fnUntracedEager$1 = (body, ...pipeables) => defineFunctionLength(body.length, pipeables.length === 0 ? function() {
  return fromIteratorEagerUnsafe(() => body.apply(this, arguments));
} : function() {
  let effect2 = fromIteratorEagerUnsafe(() => body.apply(this, arguments));
  for (const pipeable of pipeables) {
    effect2 = pipeable(effect2);
  }
  return effect2;
});
const fromIteratorEagerUnsafe = (evaluate2) => {
  try {
    const iterator = evaluate2();
    let value = void 0;
    while (true) {
      const state = iterator.next(value);
      if (state.done) {
        return succeed$3(state.value);
      }
      const yieldable = state.value;
      const effect2 = yieldable.asEffect();
      const primitive = effect2;
      if (primitive && primitive._tag === "Success") {
        value = primitive.value;
        continue;
      } else if (primitive && primitive._tag === "Failure") {
        return effect2;
      } else {
        let isFirstExecution = true;
        return suspend$1(() => {
          if (isFirstExecution) {
            isFirstExecution = false;
            return flatMap$1(effect2, (value2) => fromIteratorUnsafe(iterator, value2));
          } else {
            return suspend$1(() => fromIteratorUnsafe(evaluate2()));
          }
        });
      }
    }
  } catch (error) {
    return die$1(error);
  }
};
const fromIteratorUnsafe = /* @__PURE__ */ makePrimitive({
  op: "Iterator",
  single: false,
  [contA](value, fiber) {
    const iter = this[args][0];
    while (true) {
      const state = iter.next(value);
      if (state.done) return succeed$3(state.value);
      const eff = state.value.asEffect();
      if (!effectIsExit(eff)) {
        fiber._stack.push(this);
        return eff;
      } else if (eff._tag === "Failure") {
        return eff;
      }
      value = eff.value;
    }
  },
  [evaluate](fiber) {
    return this[contA](this[args][1], fiber);
  }
});
const as = /* @__PURE__ */ dual(2, (self, value) => {
  const b = succeed$3(value);
  return flatMap$1(self, (_) => b);
});
const asSome = (self) => map$1(self, some);
const andThen$1 = /* @__PURE__ */ dual(2, (self, f) => flatMap$1(self, (a) => isEffect$1(f) ? f : internalCall(() => f(a))));
const tap = /* @__PURE__ */ dual(2, (self, f) => flatMap$1(self, (a) => as(isEffect$1(f) ? f : internalCall(() => f(a)), a)));
const asVoid = (self) => flatMap$1(self, (_) => exitVoid);
const raceAllFirst = (all2, options) => withFiber$1((parent) => callback$1((resume) => {
  let done2 = false;
  const fibers = /* @__PURE__ */ new Set();
  const onExit2 = (exit2) => {
    done2 = true;
    resume(fibers.size === 0 ? exit2 : flatMap$1(uninterruptible(fiberInterruptAll(fibers)), () => exit2));
  };
  let i = 0;
  for (const effect2 of all2) {
    if (done2) break;
    const index = i++;
    const fiber = forkUnsafe$1(parent, effect2, true, true, false);
    fibers.add(fiber);
    fiber.addObserver((exit2) => {
      fibers.delete(fiber);
      const isWinner = !done2;
      onExit2(exit2);
      if (isWinner && options?.onWinner) {
        options.onWinner({
          fiber,
          index,
          parentFiber: parent
        });
      }
    });
  }
  return fiberInterruptAll(fibers);
}));
const raceFirst$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[1]), (self, that, options) => raceAllFirst([self, that], options));
const flatMap$1 = /* @__PURE__ */ dual(2, (self, f) => {
  const onSuccess = Object.create(OnSuccessProto);
  onSuccess[args] = self;
  onSuccess[contA] = f.length !== 1 ? (a) => f(a) : f;
  return onSuccess;
});
const OnSuccessProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccess",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
const effectIsExit = (effect2) => ExitTypeId in effect2;
const flatMapEager$1 = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    return self._tag === "Success" ? f(self.value) : self;
  }
  return flatMap$1(self, f);
});
const map$1 = /* @__PURE__ */ dual(2, (self, f) => flatMap$1(self, (a) => succeed$3(internalCall(() => f(a)))));
const mapEager$1 = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMap(self, f) : map$1(self, f));
const mapErrorEager$1 = /* @__PURE__ */ dual(2, (self, f) => effectIsExit(self) ? exitMapError(self, f) : mapError(self, f));
const mapBothEager$1 = /* @__PURE__ */ dual(2, (self, options) => effectIsExit(self) ? exitMapBoth(self, options) : mapBoth(self, options));
const catchEager$1 = /* @__PURE__ */ dual(2, (self, f) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return self;
    const error = findError$1(self.cause);
    if (isFailure$1(error)) return self;
    return f(error.success);
  }
  return catch_(self, f);
});
const exitInterrupt = (fiberId) => exitFailCause(causeInterrupt(fiberId));
const exitIsSuccess = (self) => self._tag === "Success";
const exitIsFailure = (self) => self._tag === "Failure";
const exitFilterCause = (self) => self._tag === "Failure" ? succeed$4(self.cause) : fail$3(self);
const exitVoid = /* @__PURE__ */ exitSucceed(void 0);
const exitMap = /* @__PURE__ */ dual(2, (self, f) => self._tag === "Success" ? exitSucceed(f(self.value)) : self);
const exitMapError = /* @__PURE__ */ dual(2, (self, f) => {
  if (self._tag === "Success") return self;
  const error = findError$1(self.cause);
  if (isFailure$1(error)) return self;
  return exitFail(f(error.success));
});
const exitMapBoth = /* @__PURE__ */ dual(2, (self, options) => {
  if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
  const error = findError$1(self.cause);
  if (isFailure$1(error)) return self;
  return exitFail(options.onFailure(error.success));
});
const exitZipRight = /* @__PURE__ */ dual(2, (self, that) => exitIsSuccess(self) ? that : self);
const exitAsVoidAll = (exits) => {
  const failures = [];
  for (const exit2 of exits) {
    if (exit2._tag === "Failure") {
      failures.push(...exit2.cause.reasons);
    }
  }
  return failures.length === 0 ? exitVoid : exitFailCause(causeFromReasons(failures));
};
const exitGetSuccess = (self) => exitIsSuccess(self) ? some(self.value) : none();
const updateServices$1 = /* @__PURE__ */ dual(2, (self, f) => withFiber$1((fiber) => {
  const prev = fiber.services;
  const nextServices = f(prev);
  if (prev === nextServices) return self;
  fiber.setServices(nextServices);
  return onExitPrimitive(self, () => {
    fiber.setServices(prev);
    return void 0;
  });
}));
const updateService = /* @__PURE__ */ dual(3, (self, service, f) => updateServices$1(self, (s) => {
  const prev = getUnsafe(s, service);
  const next = f(prev);
  if (prev === next) return s;
  return add(s, service, next);
}));
const services$1 = () => getServiceMap;
const getServiceMap = /* @__PURE__ */ withFiber$1((fiber) => succeed$3(fiber.services));
const servicesWith$1 = (f) => withFiber$1((fiber) => f(fiber.services));
const provideServices$3 = /* @__PURE__ */ dual(2, (self, services2) => {
  if (effectIsExit(self)) return self;
  return updateServices$1(self, merge$1(services2));
});
const provideService$1 = function() {
  if (arguments.length === 1) {
    return dual(2, (self, impl) => provideServiceImpl(self, arguments[0], impl));
  }
  return dual(3, (self, service, impl) => provideServiceImpl(self, service, impl)).apply(this, arguments);
};
const provideServiceImpl = (self, service, implementation) => updateServices$1(self, (s) => {
  const prev = s.mapUnsafe.get(service.key);
  if (prev === implementation) return s;
  return add(s, service, implementation);
});
const zip = /* @__PURE__ */ dual((args2) => isEffect$1(args2[1]), (self, that, options) => zipWith(self, that, (a, a2) => [a, a2], options));
const zipWith = /* @__PURE__ */ dual((args2) => isEffect$1(args2[1]), (self, that, f, options) => options?.concurrent ? map$1(all([self, that], {
  concurrency: 2
}), ([a, a2]) => internalCall(() => f(a, a2))) : flatMap$1(self, (a) => map$1(that, (a2) => internalCall(() => f(a, a2)))));
const forever$2 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, options) => whileLoop$1({
  while: constTrue,
  body: constant(options?.disableYield ? self : flatMap$1(self, (_) => yieldNow)),
  step: constVoid
}));
const catchCause$1 = /* @__PURE__ */ dual(2, (self, f) => {
  const onFailure = Object.create(OnFailureProto);
  onFailure[args] = self;
  onFailure[contE] = f.length !== 1 ? (cause) => f(cause) : f;
  return onFailure;
});
const OnFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnFailure",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
const catchCauseFilter = /* @__PURE__ */ dual(3, (self, filter2, f) => catchCause$1(self, (cause) => {
  const eb = filter2(cause);
  return isFailure$1(eb) ? failCause$3(eb.failure) : internalCall(() => f(eb.success, cause));
}));
const catch_ = /* @__PURE__ */ dual(2, (self, f) => catchCauseFilter(self, findError$1, (e) => f(e)));
const tapCause$1 = /* @__PURE__ */ dual(2, (self, f) => catchCause$1(self, (cause) => andThen$1(internalCall(() => f(cause)), failCause$3(cause))));
const catchFilter$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, filter2, f, orElse) => catchCause$1(self, (cause) => {
  const error = findError$1(cause);
  if (isFailure$1(error)) return failCause$3(error.failure);
  const result2 = filter2(error.success);
  if (isFailure$1(result2)) {
    return orElse ? internalCall(() => orElse(result2.failure)) : failCause$3(cause);
  }
  return internalCall(() => f(result2.success));
}));
const mapError = /* @__PURE__ */ dual(2, (self, f) => catch_(self, (error) => failSync(() => f(error))));
const mapBoth = /* @__PURE__ */ dual(2, (self, options) => matchEffect$1(self, {
  onFailure: (e) => failSync(() => options.onFailure(e)),
  onSuccess: (a) => sync$1(() => options.onSuccess(a))
}));
const orDie$1 = (self) => catch_(self, die$1);
const ignore$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, options) => {
  if (!options?.log) {
    return matchEffect$1(self, {
      onFailure: (_) => void_$2,
      onSuccess: (_) => void_$2
    });
  }
  const logEffect = logWithLevel(options.log === true ? void 0 : options.log);
  return matchCauseEffect$1(self, {
    onFailure(cause) {
      const failure = findFail(cause);
      return isFailure$1(failure) ? failCause$3(failure.failure) : logEffect(cause);
    },
    onSuccess: (_) => void_$2
  });
});
const result = (self) => matchEager(self, {
  onFailure: fail$3,
  onSuccess: succeed$4
});
const matchCauseEffect$1 = /* @__PURE__ */ dual(2, (self, options) => {
  const primitive = Object.create(OnSuccessAndFailureProto);
  primitive[args] = self;
  primitive[contA] = options.onSuccess.length !== 1 ? (a) => options.onSuccess(a) : options.onSuccess;
  primitive[contE] = options.onFailure.length !== 1 ? (cause) => options.onFailure(cause) : options.onFailure;
  return primitive;
});
const OnSuccessAndFailureProto = /* @__PURE__ */ makePrimitiveProto({
  op: "OnSuccessAndFailure",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  }
});
const matchEffect$1 = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect$1(self, {
  onFailure: (cause) => {
    const fail2 = cause.reasons.find(isFailReason);
    return fail2 ? internalCall(() => options.onFailure(fail2.error)) : failCause$3(cause);
  },
  onSuccess: options.onSuccess
}));
const match = /* @__PURE__ */ dual(2, (self, options) => matchEffect$1(self, {
  onFailure: (error) => sync$1(() => options.onFailure(error)),
  onSuccess: (value) => sync$1(() => options.onSuccess(value))
}));
const matchEager = /* @__PURE__ */ dual(2, (self, options) => {
  if (effectIsExit(self)) {
    if (self._tag === "Success") return exitSucceed(options.onSuccess(self.value));
    const error = findError$1(self.cause);
    if (isFailure$1(error)) return self;
    return exitSucceed(options.onFailure(error.success));
  }
  return match(self, options);
});
const exit$1 = (self) => effectIsExit(self) ? exitSucceed(self) : exitPrimitive(self);
const exitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "Exit",
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args];
  },
  [contA](value, _, exit2) {
    return succeed$3(exit2 ?? exitSucceed(value));
  },
  [contE](cause, _, exit2) {
    return succeed$3(exit2 ?? exitFailCause(cause));
  }
});
const delay$1 = /* @__PURE__ */ dual(2, (self, duration) => andThen$1(sleep$1(duration), self));
const timeoutOrElse$1 = /* @__PURE__ */ dual(2, (self, options) => raceFirst$1(self, flatMap$1(sleep$1(options.duration), options.onTimeout)));
const timeout$1 = /* @__PURE__ */ dual(2, (self, duration) => timeoutOrElse$1(self, {
  duration,
  onTimeout: () => fail$2(new TimeoutError())
}));
const ScopeTypeId = "~effect/Scope";
const ScopeCloseableTypeId = "~effect/Scope/Closeable";
const scopeTag = /* @__PURE__ */ Service("effect/Scope");
const scopeClose = (self, exit_) => suspend$1(() => scopeCloseUnsafe(self, exit_) ?? void_$2);
const scopeCloseUnsafe = (self, exit_) => {
  if (self.state._tag === "Closed") return;
  const closed = {
    _tag: "Closed",
    exit: exit_
  };
  if (self.state._tag === "Empty") {
    self.state = closed;
    return;
  }
  const {
    finalizers
  } = self.state;
  self.state = closed;
  if (finalizers.size === 0) {
    return;
  } else if (finalizers.size === 1) {
    return finalizers.values().next().value(exit_);
  }
  return scopeCloseFinalizers(self, finalizers, exit_);
};
const scopeCloseFinalizers = /* @__PURE__ */ fnUntraced$1(function* (self, finalizers, exit_) {
  let exits = [];
  const fibers = [];
  const arr = Array.from(finalizers.values());
  const parent = getCurrentFiber();
  for (let i = arr.length - 1; i >= 0; i--) {
    const finalizer = arr[i];
    if (self.strategy === "sequential") {
      exits.push(yield* exit$1(finalizer(exit_)));
    } else {
      fibers.push(forkUnsafe$1(parent, finalizer(exit_), true, true, "inherit"));
    }
  }
  if (fibers.length > 0) {
    exits = yield* fiberAwaitAll(fibers);
  }
  return yield* exitAsVoidAll(exits);
});
const scopeForkUnsafe = (scope2, finalizerStrategy) => {
  const newScope = scopeMakeUnsafe(finalizerStrategy);
  if (scope2.state._tag === "Closed") {
    newScope.state = scope2.state;
    return newScope;
  }
  const key = {};
  scopeAddFinalizerUnsafe(scope2, key, (exit2) => scopeClose(newScope, exit2));
  scopeAddFinalizerUnsafe(newScope, key, (_) => sync$1(() => scopeRemoveFinalizerUnsafe(scope2, key)));
  return newScope;
};
const scopeAddFinalizerExit = (scope2, finalizer) => {
  return suspend$1(() => {
    if (scope2.state._tag === "Closed") {
      return finalizer(scope2.state.exit);
    }
    scopeAddFinalizerUnsafe(scope2, {}, finalizer);
    return void_$2;
  });
};
const scopeAddFinalizer = (scope2, finalizer) => scopeAddFinalizerExit(scope2, constant(finalizer));
const scopeAddFinalizerUnsafe = (scope2, key, finalizer) => {
  if (scope2.state._tag === "Empty") {
    scope2.state = {
      _tag: "Open",
      finalizers: /* @__PURE__ */ new Map([[key, finalizer]])
    };
  } else if (scope2.state._tag === "Open") {
    scope2.state.finalizers.set(key, finalizer);
  }
};
const scopeRemoveFinalizerUnsafe = (scope2, key) => {
  if (scope2.state._tag === "Open") {
    scope2.state.finalizers.delete(key);
  }
};
const scopeMakeUnsafe = (finalizerStrategy = "sequential") => ({
  [ScopeCloseableTypeId]: ScopeCloseableTypeId,
  [ScopeTypeId]: ScopeTypeId,
  strategy: finalizerStrategy,
  state: constScopeEmpty
});
const constScopeEmpty = {
  _tag: "Empty"
};
const scope = /* @__PURE__ */ scopeTag.asEffect();
const provideScope = /* @__PURE__ */ provideService$1(scopeTag);
const scoped$1 = (self) => withFiber$1((fiber) => {
  const prev = fiber.services;
  const scope2 = scopeMakeUnsafe();
  fiber.setServices(add(fiber.services, scopeTag, scope2));
  return onExitPrimitive(self, (exit2) => {
    fiber.setServices(prev);
    return scopeCloseUnsafe(scope2, exit2);
  });
});
const scopedWith$1 = (f) => suspend$1(() => {
  const scope2 = scopeMakeUnsafe();
  return onExit$1(f(scope2), (exit2) => suspend$1(() => scopeCloseUnsafe(scope2, exit2) ?? void_$2));
});
const acquireRelease$1 = (acquire, release) => uninterruptible(flatMap$1(scope, (scope2) => tap(acquire, (a) => scopeAddFinalizerExit(scope2, (exit2) => internalCall(() => release(a, exit2))))));
const onExitPrimitive = /* @__PURE__ */ makePrimitive({
  op: "OnExit",
  single: false,
  [evaluate](fiber) {
    fiber._stack.push(this);
    return this[args][0];
  },
  [contAll](fiber) {
    if (fiber.interruptible && this[args][2] !== true) {
      fiber._stack.push(setInterruptibleTrue);
      fiber.interruptible = false;
    }
  },
  [contA](value, _, exit2) {
    exit2 ??= exitSucceed(value);
    const eff = this[args][1](exit2);
    return eff ? flatMap$1(eff, (_2) => exit2) : exit2;
  },
  [contE](cause, _, exit2) {
    exit2 ??= exitFailCause(cause);
    const eff = this[args][1](exit2);
    return eff ? flatMap$1(eff, (_2) => exit2) : exit2;
  }
});
const onExit$1 = /* @__PURE__ */ dual(2, onExitPrimitive);
const ensuring$1 = /* @__PURE__ */ dual(2, (self, finalizer) => onExit$1(self, (_) => finalizer));
const onExitFilter = /* @__PURE__ */ dual(3, (self, filter2, f) => onExit$1(self, (exit2) => {
  const b = filter2(exit2);
  return isFailure$1(b) ? void_$2 : f(b.success, exit2);
}));
const onError$1 = /* @__PURE__ */ dual(2, (self, f) => onExitFilter(self, exitFilterCause, f));
const onErrorFilter = /* @__PURE__ */ dual(3, (self, filter2, f) => onExit$1(self, (exit2) => {
  if (exit2._tag !== "Failure") {
    return void_$2;
  }
  const result2 = filter2(exit2.cause);
  return isFailure$1(result2) ? void_$2 : f(result2.success, exit2.cause);
}));
const onInterrupt$1 = /* @__PURE__ */ dual(2, (self, finalizer) => onErrorFilter(causeFilterInterruptors, finalizer)(self));
const interrupt$3 = /* @__PURE__ */ withFiber$1((fiber) => failCause$3(causeInterrupt(fiber.id)));
const uninterruptible = (self) => withFiber$1((fiber) => {
  if (!fiber.interruptible) return self;
  fiber.interruptible = false;
  fiber._stack.push(setInterruptibleTrue);
  return self;
});
const setInterruptible = /* @__PURE__ */ makePrimitive({
  op: "SetInterruptible",
  [contAll](fiber) {
    fiber.interruptible = this[args];
    if (fiber._interruptedCause && fiber.interruptible) {
      return () => failCause$3(fiber._interruptedCause);
    }
  }
});
const setInterruptibleTrue = /* @__PURE__ */ setInterruptible(true);
const setInterruptibleFalse = /* @__PURE__ */ setInterruptible(false);
const interruptible$1 = (self) => withFiber$1((fiber) => {
  if (fiber.interruptible) return self;
  fiber.interruptible = true;
  fiber._stack.push(setInterruptibleFalse);
  if (fiber._interruptedCause) return failCause$3(fiber._interruptedCause);
  return self;
});
const uninterruptibleMask = (f) => withFiber$1((fiber) => {
  if (!fiber.interruptible) return f(identity);
  fiber.interruptible = false;
  fiber._stack.push(setInterruptibleTrue);
  return f(interruptible$1);
});
const all = (arg, options) => {
  if (isIterable(arg)) {
    return options?.mode === "result" ? forEach$1(arg, result, options) : forEach$1(arg, identity, options);
  } else if (options?.discard) {
    return options.mode === "result" ? forEach$1(Object.values(arg), result, options) : forEach$1(Object.values(arg), identity, options);
  }
  return suspend$1(() => {
    const out = {};
    return as(forEach$1(Object.entries(arg), ([key, effect2]) => map$1(options?.mode === "result" ? result(effect2) : effect2, (value) => {
      out[key] = value;
    }), {
      discard: true,
      concurrency: options?.concurrency
    }), out);
  });
};
const whileLoop$1 = /* @__PURE__ */ makePrimitive({
  op: "While",
  [contA](value, fiber) {
    this[args].step(value);
    if (this[args].while()) {
      fiber._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  },
  [evaluate](fiber) {
    if (this[args].while()) {
      fiber._stack.push(this);
      return this[args].body();
    }
    return exitVoid;
  }
});
const forEach$1 = /* @__PURE__ */ dual((args2) => typeof args2[1] === "function", (iterable, f, options) => withFiber$1((parent) => {
  const concurrencyOption = options?.concurrency === "inherit" ? parent.getRef(CurrentConcurrency) : options?.concurrency ?? 1;
  const concurrency = concurrencyOption === "unbounded" ? Number.POSITIVE_INFINITY : Math.max(1, concurrencyOption);
  if (concurrency === 1) {
    return forEachSequential(iterable, f, options);
  }
  const items = fromIterable(iterable);
  let length = items.length;
  if (length === 0) {
    return options?.discard ? void_$2 : succeed$3([]);
  }
  const out = options?.discard ? void 0 : new Array(length);
  let index = 0;
  const annotations = fiberStackAnnotations(parent);
  return callback$1((resume) => {
    const fibers = /* @__PURE__ */ new Set();
    const failures = [];
    let failed = false;
    let inProgress = 0;
    let doneCount = 0;
    let pumping = false;
    let interrupted = false;
    function pump() {
      pumping = true;
      while (inProgress < concurrency && index < length) {
        const currentIndex = index;
        const item = items[currentIndex];
        index++;
        inProgress++;
        try {
          const child = forkUnsafe$1(parent, f(item, currentIndex), true, true, "inherit");
          fibers.add(child);
          child.addObserver((exit2) => {
            if (interrupted) {
              return;
            }
            fibers.delete(child);
            if (exit2._tag === "Failure") {
              if (!failed) {
                failed = true;
                length = index;
                failures.push(...exit2.cause.reasons);
                fibers.forEach((fiber) => fiber.interruptUnsafe(parent.id, annotations));
              } else {
                for (const f2 of exit2.cause.reasons) {
                  if (f2._tag === "Interrupt") continue;
                  failures.push(f2);
                }
              }
            } else if (out !== void 0) {
              out[currentIndex] = exit2.value;
            }
            doneCount++;
            inProgress--;
            if (doneCount === length) {
              resume(failures.length > 0 ? exitFailCause(causeFromReasons(failures)) : succeed$3(out));
            } else if (!pumping && !failed && inProgress < concurrency) {
              pump();
            }
          });
        } catch (err) {
          failed = true;
          length = index;
          failures.push(new Die(err));
          fibers.forEach((fiber) => fiber.interruptUnsafe(parent.id, annotations));
        }
      }
      pumping = false;
    }
    pump();
    return suspend$1(() => {
      interrupted = true;
      index = length;
      return fiberInterruptAll(fibers);
    });
  });
}));
const forEachSequential = (iterable, f, options) => suspend$1(() => {
  const out = options?.discard ? void 0 : [];
  const iterator = iterable[Symbol.iterator]();
  let state = iterator.next();
  let index = 0;
  return as(whileLoop$1({
    while: () => !state.done,
    body: () => f(state.value, index++),
    step: (b) => {
      if (out) out.push(b);
      state = iterator.next();
    }
  }), out);
});
const forkUnsafe$1 = (parent, effect2, immediate = false, daemon = false, uninterruptible2 = false) => {
  const interruptible2 = uninterruptible2 === "inherit" ? parent.interruptible : !uninterruptible2;
  const child = new FiberImpl(parent.services, interruptible2);
  if (immediate) {
    child.evaluate(effect2);
  } else {
    parent.currentScheduler.scheduleTask(() => child.evaluate(effect2), 0);
  }
  if (!daemon && !child._exit) {
    parent.children().add(child);
    child.addObserver(() => parent._children.delete(child));
  }
  return child;
};
const forkIn$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, scope2, options) => withFiber$1((parent) => {
  const fiber = forkUnsafe$1(parent, self, options?.startImmediately, true, options?.uninterruptible);
  if (!fiber._exit) {
    if (scope2.state._tag !== "Closed") {
      const key = {};
      const finalizer = () => withFiberId((interruptor) => interruptor === fiber.id ? void_$2 : fiberInterrupt(fiber));
      scopeAddFinalizerUnsafe(scope2, key, finalizer);
      fiber.addObserver(() => scopeRemoveFinalizerUnsafe(scope2, key));
    } else {
      fiber.interruptUnsafe(parent.id, fiberStackAnnotations(parent));
    }
  }
  return succeed$3(fiber);
}));
const forkScoped$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, options) => flatMap$1(scope, (scope2) => forkIn$1(self, scope2, options)));
const runForkWith$1 = (services2) => (effect2, options) => {
  const scheduler = options?.scheduler || !services2.mapUnsafe.has(Scheduler.key) && new MixedScheduler();
  const fiber = new FiberImpl(scheduler ? add(services2, Scheduler, scheduler) : services2, options?.uninterruptible !== true);
  fiber.evaluate(effect2);
  if (fiber._exit) return fiber;
  if (options?.signal) {
    if (options.signal.aborted) {
      fiber.interruptUnsafe();
    } else {
      const abort = () => fiber.interruptUnsafe();
      options.signal.addEventListener("abort", abort, {
        once: true
      });
      fiber.addObserver(() => options.signal.removeEventListener("abort", abort));
    }
  }
  return fiber;
};
const runFork$1 = /* @__PURE__ */ runForkWith$1(/* @__PURE__ */ empty$1());
const runPromiseExitWith = (services2) => {
  const runFork2 = runForkWith$1(services2);
  return (effect2, options) => {
    const fiber = runFork2(effect2, options);
    return new Promise((resolve2) => {
      fiber.addObserver((exit2) => resolve2(exit2));
    });
  };
};
const runPromiseWith = (services2) => {
  const runPromiseExit = runPromiseExitWith(services2);
  return (effect2, options) => runPromiseExit(effect2, options).then((exit2) => {
    if (exit2._tag === "Failure") {
      throw causeSquash(exit2.cause);
    }
    return exit2.value;
  });
};
const runPromise$1 = /* @__PURE__ */ runPromiseWith(/* @__PURE__ */ empty$1());
const runSyncExitWith = (services2) => {
  const runFork2 = runForkWith$1(services2);
  return (effect2) => {
    if (effectIsExit(effect2)) return effect2;
    const scheduler = new MixedScheduler("sync");
    const fiber = runFork2(effect2, {
      scheduler
    });
    scheduler.flush();
    return fiber._exit ?? exitDie(fiber);
  };
};
const runSyncExit$1 = /* @__PURE__ */ runSyncExitWith(/* @__PURE__ */ empty$1());
const runSyncWith = (services2) => {
  const runSyncExit2 = runSyncExitWith(services2);
  return (effect2) => {
    const exit2 = runSyncExit2(effect2);
    if (exit2._tag === "Failure") throw causeSquash(exit2.cause);
    return exit2.value;
  };
};
const runSync$1 = /* @__PURE__ */ runSyncWith(/* @__PURE__ */ empty$1());
class Semaphore {
  waiters = /* @__PURE__ */ new Set();
  taken = 0;
  permits;
  constructor(permits) {
    this.permits = permits;
  }
  get free() {
    return this.permits - this.taken;
  }
  take = (n) => {
    const take2 = suspend$1(() => {
      if (this.free < n) {
        return callback$1((resume) => {
          if (this.free >= n) return resume(take2);
          const observer = () => {
            if (this.free < n) return;
            this.waiters.delete(observer);
            resume(take2);
          };
          this.waiters.add(observer);
          return sync$1(() => {
            this.waiters.delete(observer);
          });
        });
      }
      this.taken += n;
      return succeed$3(n);
    });
    return take2;
  };
  updateTakenUnsafe(fiber, f) {
    this.taken = f(this.taken);
    if (this.waiters.size > 0) {
      fiber.currentScheduler.scheduleTask(() => {
        const iter = this.waiters.values();
        let item = iter.next();
        while (item.done === false && this.free > 0) {
          item.value();
          item = iter.next();
        }
      }, 0);
    }
    return succeed$3(this.free);
  }
  updateTaken(f) {
    return withFiber$1((fiber) => this.updateTakenUnsafe(fiber, f));
  }
  resize = (permits) => asVoid(withFiber$1((fiber) => {
    this.permits = permits;
    if (this.free < 0) {
      return void_$2;
    }
    return this.updateTakenUnsafe(fiber, (taken) => taken);
  }));
  release = (n) => this.updateTaken((taken) => taken - n);
  releaseAll = /* @__PURE__ */ this.updateTaken((_) => 0);
  withPermits = (n) => (self) => uninterruptibleMask((restore) => flatMap$1(restore(this.take(n)), (permits) => onExitPrimitive(restore(self), () => this.release(permits), true)));
  withPermit = /* @__PURE__ */ this.withPermits(1);
  withPermitsIfAvailable = (n) => (self) => uninterruptibleMask((restore) => suspend$1(() => {
    if (this.free < n) {
      return succeedNone$1;
    }
    this.taken += n;
    return ensuring$1(restore(asSome(self)), this.release(n));
  }));
}
const makeSemaphoreUnsafe = (permits) => new Semaphore(permits);
const succeedTrue = /* @__PURE__ */ succeed$3(true);
const succeedFalse = /* @__PURE__ */ succeed$3(false);
class Latch {
  waiters = [];
  scheduled = false;
  isOpen;
  constructor(isOpen) {
    this.isOpen = isOpen;
  }
  scheduleUnsafe(fiber) {
    if (this.scheduled || this.waiters.length === 0) {
      return succeedTrue;
    }
    this.scheduled = true;
    fiber.currentScheduler.scheduleTask(this.flushWaiters, 0);
    return succeedTrue;
  }
  flushWaiters = () => {
    this.scheduled = false;
    const waiters = this.waiters;
    this.waiters = [];
    for (let i = 0; i < waiters.length; i++) {
      waiters[i](exitVoid);
    }
  };
  open = /* @__PURE__ */ withFiber$1((fiber) => {
    if (this.isOpen) return succeedFalse;
    this.isOpen = true;
    return this.scheduleUnsafe(fiber);
  });
  release = /* @__PURE__ */ withFiber$1((fiber) => this.open ? succeedFalse : this.scheduleUnsafe(fiber));
  openUnsafe() {
    if (this.isOpen) return false;
    this.isOpen = true;
    this.flushWaiters();
    return true;
  }
  await = /* @__PURE__ */ callback$1((resume) => {
    if (this.isOpen) {
      return resume(void_$2);
    }
    this.waiters.push(resume);
    return sync$1(() => {
      const index = this.waiters.indexOf(resume);
      if (index !== -1) {
        this.waiters.splice(index, 1);
      }
    });
  });
  closeUnsafe() {
    if (!this.isOpen) return false;
    this.isOpen = false;
    return true;
  }
  close = /* @__PURE__ */ sync$1(() => this.closeUnsafe());
  whenOpen = (self) => andThen$1(this.await, self);
}
const makeLatchUnsafe = (open) => new Latch(open ?? false);
const bigint0 = /* @__PURE__ */ BigInt(0);
const NoopSpanProto = {
  _tag: "Span",
  spanId: "noop",
  traceId: "noop",
  sampled: false,
  status: {
    _tag: "Ended",
    startTime: bigint0,
    endTime: bigint0,
    exit: exitVoid
  },
  attributes: /* @__PURE__ */ new Map(),
  links: [],
  kind: "internal",
  attribute() {
  },
  event() {
  },
  end() {
  },
  addLinks() {
  }
};
const noopSpan = (options) => Object.assign(Object.create(NoopSpanProto), options);
const filterDisablePropagation = (span) => {
  if (span) {
    return get(span.annotations, DisablePropagation) ? span._tag === "Span" ? filterDisablePropagation(span.parent) : void 0 : span;
  }
};
const makeSpanUnsafe = (fiber, name, options) => {
  const disablePropagation = !fiber.getRef(TracerEnabled) || options?.annotations && get(options.annotations, DisablePropagation);
  const parent = options?.parent ?? (options?.root ? void 0 : filterDisablePropagation(fiber.currentSpan));
  let span;
  if (disablePropagation) {
    span = noopSpan({
      name,
      parent,
      annotations: add(options?.annotations ?? empty$1(), DisablePropagation, true)
    });
  } else {
    const tracer = fiber.getRef(Tracer);
    const clock = fiber.getRef(ClockRef);
    const timingEnabled = fiber.getRef(TracerTimingEnabled);
    const annotationsFromEnv = fiber.getRef(TracerSpanAnnotations);
    const linksFromEnv = fiber.getRef(TracerSpanLinks);
    const level = options?.level ?? fiber.getRef(CurrentTraceLevel);
    const links = options?.links !== void 0 ? [...linksFromEnv, ...options.links] : linksFromEnv.slice();
    span = tracer.span({
      name,
      parent,
      annotations: options?.annotations ?? empty$1(),
      links,
      startTime: timingEnabled ? clock.currentTimeNanosUnsafe() : 0n,
      kind: options?.kind ?? "internal",
      root: options?.root ?? options?.parent === void 0,
      sampled: options?.sampled ?? (parent?.sampled === false ? false : !isLogLevelGreaterThan(fiber.getRef(MinimumTraceLevel), level))
    });
    for (const [key, value] of Object.entries(annotationsFromEnv)) {
      span.attribute(key, value);
    }
    if (options?.attributes !== void 0) {
      for (const [key, value] of Object.entries(options.attributes)) {
        span.attribute(key, value);
      }
    }
  }
  return span;
};
const makeSpanScoped$1 = (name, options) => uninterruptible(withFiber$1((fiber) => {
  const scope2 = getUnsafe(fiber.services, scopeTag);
  const span = makeSpanUnsafe(fiber, name, options ?? {});
  const clock = fiber.getRef(ClockRef);
  const timingEnabled = fiber.getRef(TracerTimingEnabled);
  return as(scopeAddFinalizerExit(scope2, (exit2) => endSpan(span, exit2, clock, timingEnabled)), span);
}));
const provideSpanStackFrame = (name, stack) => {
  stack = typeof stack === "function" ? stack : constUndefined;
  return updateService(CurrentStackFrame, (parent) => ({
    name,
    stack,
    parent
  }));
};
const endSpan = (span, exit2, clock, timingEnabled) => sync$1(() => {
  if (span.status._tag === "Ended") return;
  span.end(timingEnabled ? clock.currentTimeNanosUnsafe() : bigint0, exit2);
});
const useSpan$1 = (name, ...args2) => {
  const options = args2.length === 1 ? void 0 : args2[0];
  const evaluate2 = args2[args2.length - 1];
  return withFiber$1((fiber) => {
    const span = makeSpanUnsafe(fiber, name, options);
    const clock = fiber.getRef(ClockRef);
    return onExit$1(internalCall(() => evaluate2(span)), (exit2) => sync$1(() => {
      if (span.status._tag === "Ended") return;
      span.end(clock.currentTimeNanosUnsafe(), exit2);
    }));
  });
};
const provideParentSpan = /* @__PURE__ */ provideService$1(ParentSpan);
const withParentSpan$1 = function() {
  const dataFirst = isEffect$1(arguments[0]);
  const span = dataFirst ? arguments[1] : arguments[0];
  let options = dataFirst ? arguments[2] : arguments[1];
  let provideStackFrame = identity;
  if (span._tag === "Span") {
    options = addSpanStackTrace(options);
    provideStackFrame = provideSpanStackFrame(span.name, options?.captureStackTrace);
  }
  if (dataFirst) {
    return provideParentSpan(provideStackFrame(arguments[0]), span);
  }
  return (self) => provideParentSpan(provideStackFrame(self), span);
};
const ClockRef = /* @__PURE__ */ Reference("effect/Clock", {
  defaultValue: () => new ClockImpl()
});
const MAX_TIMER_MILLIS = 2 ** 31 - 1;
class ClockImpl {
  currentTimeMillisUnsafe() {
    return Date.now();
  }
  currentTimeMillis = /* @__PURE__ */ sync$1(() => this.currentTimeMillisUnsafe());
  currentTimeNanosUnsafe() {
    return processOrPerformanceNow();
  }
  currentTimeNanos = /* @__PURE__ */ sync$1(() => this.currentTimeNanosUnsafe());
  sleep(duration) {
    const millis2 = toMillis(duration);
    if (millis2 <= 0) return yieldNow;
    return callback$1((resume) => {
      if (millis2 > MAX_TIMER_MILLIS) return;
      const handle = setTimeout(() => resume(void_$2), millis2);
      return sync$1(() => clearTimeout(handle));
    });
  }
}
const performanceNowNanos = /* @__PURE__ */ (function() {
  const bigint1e6 = /* @__PURE__ */ BigInt(1e6);
  if (typeof performance === "undefined" || typeof performance.now === "undefined") {
    return () => BigInt(Date.now()) * bigint1e6;
  } else if (typeof performance.timeOrigin === "number" && performance.timeOrigin === 0) {
    return () => BigInt(Math.round(performance.now() * 1e6));
  }
  const origin = /* @__PURE__ */ BigInt(/* @__PURE__ */ Date.now()) * bigint1e6 - /* @__PURE__ */ BigInt(/* @__PURE__ */ Math.round(/* @__PURE__ */ performance.now() * 1e6));
  return () => origin + BigInt(Math.round(performance.now() * 1e6));
})();
const processOrPerformanceNow = /* @__PURE__ */ (function() {
  const processHrtime = typeof process === "object" && "hrtime" in process && typeof process.hrtime.bigint === "function" ? process.hrtime : void 0;
  if (!processHrtime) {
    return performanceNowNanos;
  }
  const origin = /* @__PURE__ */ performanceNowNanos() - /* @__PURE__ */ processHrtime.bigint();
  return () => origin + processHrtime.bigint();
})();
const clockWith = (f) => withFiber$1((fiber) => f(fiber.getRef(ClockRef)));
const sleep$1 = (duration) => clockWith((clock) => clock.sleep(fromInputUnsafe(duration)));
const TimeoutErrorTypeId = "~effect/Cause/TimeoutError";
class TimeoutError extends (/* @__PURE__ */ TaggedError("TimeoutError")) {
  [TimeoutErrorTypeId] = TimeoutErrorTypeId;
  constructor(message) {
    super({
      message
    });
  }
}
const ConsoleRef = /* @__PURE__ */ Reference("effect/Console/CurrentConsole", {
  defaultValue: () => globalThis.console
});
const logLevelToOrder = (level) => {
  switch (level) {
    case "All":
      return Number.MIN_SAFE_INTEGER;
    case "Fatal":
      return 5e4;
    case "Error":
      return 4e4;
    case "Warn":
      return 3e4;
    case "Info":
      return 2e4;
    case "Debug":
      return 1e4;
    case "Trace":
      return 0;
    case "None":
      return Number.MAX_SAFE_INTEGER;
  }
};
const LogLevelOrder = /* @__PURE__ */ mapInput(Number$4, logLevelToOrder);
const isLogLevelGreaterThan = /* @__PURE__ */ isGreaterThan(LogLevelOrder);
const CurrentLoggers = /* @__PURE__ */ Reference("effect/Loggers/CurrentLoggers", {
  defaultValue: () => /* @__PURE__ */ new Set([defaultLogger, tracerLogger])
});
const LogToStderr = /* @__PURE__ */ Reference("effect/Logger/LogToStderr", {
  defaultValue: constFalse
});
const LoggerTypeId = "~effect/Logger";
const LoggerProto = {
  [LoggerTypeId]: {
    _Message: identity,
    _Output: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const loggerMake = (log) => {
  const self = Object.create(LoggerProto);
  self.log = log;
  return self;
};
const formatLabel = (key) => key.replace(/[\s="]/g, "_");
const formatLogSpan = (self, now) => {
  const label = formatLabel(self[0]);
  return `${label}=${now - self[1]}ms`;
};
const logWithLevel = (level) => (...message) => {
  let cause = void 0;
  for (let i = 0, len = message.length; i < len; i++) {
    const msg = message[i];
    if (isCause$1(msg)) {
      if (cause) {
        message.splice(i, 1);
      } else {
        message = message.slice(0, i).concat(message.slice(i + 1));
      }
      cause = cause ? causeFromReasons(cause.reasons.concat(msg.reasons)) : msg;
      i--;
    }
  }
  if (cause === void 0) {
    cause = causeEmpty;
  }
  return withFiber$1((fiber) => {
    const logLevel = level ?? fiber.currentLogLevel;
    if (isLogLevelGreaterThan(fiber.minimumLogLevel, logLevel)) {
      return void_$2;
    }
    const clock = fiber.getRef(ClockRef);
    const loggers = fiber.getRef(CurrentLoggers);
    if (loggers.size > 0) {
      const date = new Date(clock.currentTimeMillisUnsafe());
      for (const logger of loggers) {
        logger.log({
          cause,
          fiber,
          date,
          logLevel,
          message
        });
      }
    }
    return void_$2;
  });
};
const defaultDateFormat = (date) => `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
const hasProcessStdout = typeof process === "object" && process !== null && typeof process.stdout === "object" && process.stdout !== null;
hasProcessStdout && process.stdout.isTTY === true;
const defaultLogger = /* @__PURE__ */ loggerMake(({
  cause,
  date,
  fiber,
  logLevel,
  message
}) => {
  const message_ = Array.isArray(message) ? message.slice() : [message];
  if (cause.reasons.length > 0) {
    message_.unshift(causePretty(cause));
  }
  const now = date.getTime();
  const spans = fiber.getRef(CurrentLogSpans);
  let spanString = "";
  for (const span of spans) {
    spanString += ` ${formatLogSpan(span, now)}`;
  }
  const annotations = fiber.getRef(CurrentLogAnnotations);
  if (Object.keys(annotations).length > 0) {
    message_.push(annotations);
  }
  const console = fiber.getRef(ConsoleRef);
  const log = fiber.getRef(LogToStderr) ? console.error : console.log;
  log(`[${defaultDateFormat(date)}] ${logLevel.toUpperCase()} (#${fiber.id})${spanString}:`, ...message_);
});
const tracerLogger = /* @__PURE__ */ loggerMake(({
  cause,
  fiber,
  logLevel,
  message
}) => {
  const clock = fiber.getRef(ClockRef);
  const annotations = fiber.getRef(CurrentLogAnnotations);
  const span = fiber.currentSpan;
  if (span === void 0 || span._tag === "ExternalSpan") return;
  const attributes = {};
  for (const [key, value] of Object.entries(annotations)) {
    attributes[key] = value;
  }
  attributes["effect.fiberId"] = fiber.id;
  attributes["effect.logLevel"] = logLevel.toUpperCase();
  if (cause.reasons.length > 0) {
    attributes["effect.cause"] = causePretty(cause);
  }
  span.event(toStringUnknown(Array.isArray(message) && message.length === 1 ? message[0] : message), clock.currentTimeNanosUnsafe(), attributes);
});
const isCause = isCause$1;
const isReason = isCauseReason;
const fromReasons = causeFromReasons;
const makeFailReason = (error) => new Fail(error);
const makeDieReason = (defect) => new Die(defect);
const makeInterruptReason = makeInterruptReason$1;
const hasInterruptsOnly = hasInterruptsOnly$1;
const squash = causeSquash;
const findError = findError$1;
const interruptors = causeInterruptors;
const filterInterruptors = causeFilterInterruptors;
const isDone = isDone$1;
const done$1 = done$2;
const isExit = isExit$1;
const succeed$2 = exitSucceed;
const failCause$2 = exitFailCause;
const fail$1 = exitFail;
const die = exitDie;
const interrupt$2 = exitInterrupt;
const isSuccess = exitIsSuccess;
const isFailure = exitIsFailure;
const getSuccess = exitGetSuccess;
const TypeId$j = "~effect/Deferred";
const DeferredProto = {
  [TypeId$j]: {
    _A: identity,
    _E: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const makeUnsafe$5 = () => {
  const self = Object.create(DeferredProto);
  self.resumes = void 0;
  self.effect = void 0;
  return self;
};
const _await = (self) => callback$1((resume) => {
  if (self.effect) return resume(self.effect);
  self.resumes ??= [];
  self.resumes.push(resume);
  return sync$1(() => {
    const index = self.resumes.indexOf(resume);
    self.resumes.splice(index, 1);
  });
});
const completeWith = /* @__PURE__ */ dual(2, (self, effect2) => sync$1(() => doneUnsafe(self, effect2)));
const done = completeWith;
const doneUnsafe = (self, effect2) => {
  if (self.effect) return false;
  self.effect = effect2;
  if (self.resumes) {
    for (let i = 0; i < self.resumes.length; i++) {
      self.resumes[i](effect2);
    }
    self.resumes = void 0;
  }
  return true;
};
const into = /* @__PURE__ */ dual(2, (self, deferred) => uninterruptibleMask((restore) => flatMap$1(exit$1(restore(self)), (exit2) => done(deferred, exit2))));
const Scope = scopeTag;
const makeUnsafe$4 = scopeMakeUnsafe;
const provide$3 = provideScope;
const addFinalizerExit = scopeAddFinalizerExit;
const addFinalizer = scopeAddFinalizer;
const forkUnsafe = scopeForkUnsafe;
const close = scopeClose;
const TypeId$i = "~effect/Layer";
const MemoMapTypeId = "~effect/Layer/MemoMap";
const LayerProto = {
  [TypeId$i]: {
    _ROut: identity,
    _E: identity,
    _RIn: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const fromBuildUnsafe = (build) => {
  const self = Object.create(LayerProto);
  self.build = build;
  return self;
};
const fromBuild = (build) => fromBuildUnsafe((memoMap, scope2) => {
  const layerScope = forkUnsafe(scope2);
  return onExit$1(build(memoMap, layerScope), (exit2) => exit2._tag === "Failure" ? close(layerScope, exit2) : void_$2);
});
const fromBuildMemo = (build) => {
  const self = fromBuild((memoMap, scope2) => memoMap.getOrElseMemoize(self, scope2, build));
  return self;
};
class MemoMapImpl {
  get [MemoMapTypeId]() {
    return MemoMapTypeId;
  }
  map = /* @__PURE__ */ new Map();
  getOrElseMemoize(layer, scope2, build) {
    if (this.map.has(layer)) {
      const entry2 = this.map.get(layer);
      entry2.observers++;
      return andThen$1(scopeAddFinalizerExit(scope2, (exit2) => entry2.finalizer(exit2)), entry2.effect);
    }
    const layerScope = makeUnsafe$4();
    const deferred = makeUnsafe$5();
    const entry = {
      observers: 1,
      effect: _await(deferred),
      finalizer: (exit2) => suspend$1(() => {
        entry.observers--;
        if (entry.observers === 0) {
          this.map.delete(layer);
          return close(layerScope, exit2);
        }
        return void_$2;
      })
    };
    this.map.set(layer, entry);
    return scopeAddFinalizerExit(scope2, entry.finalizer).pipe(flatMap$1(() => build(this, layerScope)), onExit$1((exit2) => {
      entry.effect = exit2;
      return done(deferred, exit2);
    }));
  }
}
const makeMemoMapUnsafe = () => new MemoMapImpl();
class CurrentMemoMap extends (/* @__PURE__ */ Service()("effect/Layer/CurrentMemoMap")) {
  static getOrCreate = /* @__PURE__ */ getOrElse(this, makeMemoMapUnsafe);
}
const buildWithMemoMap = /* @__PURE__ */ dual(3, (self, memoMap, scope2) => provideService$1(map$1(self.build(memoMap, scope2), add(CurrentMemoMap, memoMap)), CurrentMemoMap, memoMap));
const buildWithScope = /* @__PURE__ */ dual(2, (self, scope2) => withFiber$1((fiber) => buildWithMemoMap(self, CurrentMemoMap.getOrCreate(fiber.services), scope2)));
const succeed$1 = function() {
  if (arguments.length === 1) {
    return (resource) => succeedServices(make$d(arguments[0], resource));
  }
  return succeedServices(make$d(arguments[0], arguments[1]));
};
const succeedServices = (services2) => fromBuildUnsafe(constant(succeed$3(services2)));
const effect = function() {
  if (arguments.length === 1) {
    return (effect2) => effectImpl(arguments[0], effect2);
  }
  return effectImpl(arguments[0], arguments[1]);
};
const effectImpl = (service, effect2) => effectServices(map$1(effect2, (value) => make$d(service, value)));
const effectServices = (effect2) => fromBuildMemo((_, scope2) => provide$3(effect2, scope2));
const mergeAllEffect = (layers, memoMap, scope2) => {
  const parentScope = forkUnsafe(scope2, "parallel");
  return forEach$1(layers, (layer) => layer.build(memoMap, forkUnsafe(parentScope, "sequential")), {
    concurrency: layers.length
  }).pipe(map$1((services2) => mergeAll$1(...services2)));
};
const mergeAll = (...layers) => fromBuild((memoMap, scope2) => mergeAllEffect(layers, memoMap, scope2));
const provideWith = (self, that, f) => fromBuild((memoMap, scope2) => flatMap$1(Array.isArray(that) ? mergeAllEffect(that, memoMap, scope2) : that.build(memoMap, scope2), (context) => self.build(memoMap, scope2).pipe(provideServices$3(context), map$1((merged) => f(merged, context)))));
const provide$2 = /* @__PURE__ */ dual(2, (self, that) => provideWith(self, that, identity));
const provideMerge = /* @__PURE__ */ dual(2, (self, that) => provideWith(self, that, (self2, that2) => merge$1(that2, self2)));
const Class$1 = class Class extends Class$2 {
  constructor(props) {
    super();
    if (props) {
      Object.assign(this, props);
    }
  }
};
const catchDone = /* @__PURE__ */ dual(2, (effect2, f) => catchCauseFilter(effect2, filterDoneLeftover, (l) => f(l)));
const isDoneCause = (cause) => cause.reasons.some(isDoneFailure);
const isDoneFailure = (failure) => failure._tag === "Fail" && isDone(failure.error);
const filterDone = /* @__PURE__ */ composePassthrough(findError, (e) => isDone(e) ? succeed$4(e) : fail$3(e));
const filterDoneLeftover = /* @__PURE__ */ composePassthrough(findError, (e) => isDone(e) ? succeed$4(e.value) : fail$3(e));
const matchEffect = /* @__PURE__ */ dual(2, (self, options) => matchCauseEffect$1(self, {
  onSuccess: options.onSuccess,
  onFailure: (cause) => {
    const halt = filterDone(cause);
    return !isFailure$1(halt) ? options.onDone(halt.success.value) : options.onFailure(halt.failure);
  }
}));
const TypeId$h = "~effect/Schedule";
const CurrentMetadata = /* @__PURE__ */ Reference("effect/Schedule/CurrentMetadata", {
  defaultValue: /* @__PURE__ */ constant({
    input: void 0,
    output: void 0,
    duration: zero,
    attempt: 0,
    start: 0,
    now: 0,
    elapsed: 0,
    elapsedSincePrevious: 0
  })
});
const ScheduleProto = {
  [TypeId$h]: {
    _Out: identity,
    _In: identity,
    _Env: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const isSchedule = (u) => hasProperty(u, TypeId$h);
const fromStep = (step) => {
  const self = Object.create(ScheduleProto);
  self.step = step;
  return self;
};
const metadataFn = () => {
  let n = 0;
  let previous;
  let start;
  return (now, input) => {
    if (start === void 0) start = now;
    const elapsed = now - start;
    const elapsedSincePrevious = previous === void 0 ? 0 : now - previous;
    previous = now;
    return {
      input,
      attempt: ++n,
      start,
      now,
      elapsed,
      elapsedSincePrevious
    };
  };
};
const fromStepWithMetadata = (step) => fromStep(map$1(step, (f) => {
  const meta = metadataFn();
  return (now, input) => f(meta(now, input));
}));
const toStep = (schedule) => catchCause$1(schedule.step, (cause) => succeed$3(() => failCause$3(cause)));
const toStepWithMetadata = (schedule) => clockWith((clock) => map$1(toStep(schedule), (step) => {
  const metaFn = metadataFn();
  return (input) => suspend$1(() => {
    const now = clock.currentTimeMillisUnsafe();
    return flatMap$1(step(now, input), ([output, duration]) => {
      const meta = metaFn(now, input);
      meta.output = output;
      meta.duration = duration;
      return as(sleep$1(duration), meta);
    });
  });
}));
const either = /* @__PURE__ */ dual(2, (self, other) => eitherWith(self, other, (left, right) => [left, right]));
const eitherWith = /* @__PURE__ */ dual(3, (self, other, combine2) => fromStep(map$1(zip(toStep(self), toStep(other)), ([stepLeft, stepRight]) => (now, input) => matchEffect(stepLeft(now, input), {
  onSuccess: (leftResult) => stepRight(now, input).pipe(map$1((rightResult) => [combine2(leftResult[0], rightResult[0]), min(leftResult[1], rightResult[1])]), catchDone((rightDone) => succeed$3([combine2(leftResult[0], rightDone), leftResult[1]]))),
  onFailure: failCause$3,
  onDone: (leftDone) => stepRight(now, input).pipe(map$1((rightResult) => [combine2(leftDone, rightResult[0]), rightResult[1]]), catchDone((rightDone) => done$1(combine2(leftDone, rightDone))))
}))));
const exponential = (base, factor = 2) => {
  const baseMillis = toMillis(fromInputUnsafe(base));
  return fromStepWithMetadata(succeed$3((meta) => {
    const duration = millis(baseMillis * Math.pow(factor, meta.attempt - 1));
    return succeed$3([duration, duration]);
  }));
};
const passthrough$2 = (self) => fromStep(map$1(toStep(self), (step) => (now, input) => matchEffect(step(now, input), {
  onSuccess: (result2) => succeed$3([input, result2[1]]),
  onFailure: failCause$3,
  onDone: () => done$1(input)
})));
const spaced = (duration) => {
  const decoded = fromInputUnsafe(duration);
  return fromStepWithMetadata(succeed$3((meta) => succeed$3([meta.attempt - 1, decoded])));
};
const while_ = /* @__PURE__ */ dual(2, (self, predicate) => fromStep(map$1(toStep(self), (step) => {
  const meta = metadataFn();
  return (now, input) => flatMap$1(step(now, input), (result2) => {
    const [output, duration] = result2;
    const eff = predicate({
      ...meta(now, input),
      output,
      duration
    });
    return flatMap$1(isEffect$1(eff) ? eff : succeed$3(eff), (check) => check ? succeed$3(result2) : done$1(output));
  });
})));
const forever$1 = /* @__PURE__ */ spaced(zero);
const provideLayer = (self, layer, options) => scopedWith$1((scope2) => flatMap$1(options?.local ? buildWithMemoMap(layer, makeMemoMapUnsafe(), scope2) : buildWithScope(layer, scope2), (context) => provideServices$3(self, context)));
const provide$1 = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (self, source, options) => isServiceMap(source) ? provideServices$3(self, source) : provideLayer(self, Array.isArray(source) ? mergeAll(...source) : source, options));
const retryOrElse = /* @__PURE__ */ dual(3, (self, policy, orElse) => flatMap$1(toStepWithMetadata(policy), (step) => {
  let meta = CurrentMetadata.defaultValue();
  let lastError;
  const loop = catch_(suspend$1(() => provideService$1(self, CurrentMetadata, meta)), (error) => {
    lastError = error;
    return flatMap$1(step(error), (meta_) => {
      meta = meta_;
      return loop;
    });
  });
  return catchDone(loop, (out) => internalCall(() => orElse(lastError, out)));
}));
const retry$1 = /* @__PURE__ */ dual(2, (self, options) => {
  const schedule = typeof options === "function" ? options(identity) : isSchedule(options) ? options : buildFromOptions(options);
  return retryOrElse(self, schedule, fail$2);
});
const passthroughForever = /* @__PURE__ */ passthrough$2(forever$1);
const buildFromOptions = (options) => {
  let schedule = options.schedule ?? passthroughForever;
  if (options.while) {
    schedule = while_(schedule, ({
      input
    }) => {
      const applied = options.while(input);
      return isEffect$1(applied) ? applied : succeed$3(applied);
    });
  }
  if (options.until) {
    schedule = while_(schedule, ({
      input
    }) => {
      const applied = options.until(input);
      return isEffect$1(applied) ? map$1(applied, (b) => !b) : succeed$3(!applied);
    });
  }
  if (options.times !== void 0) {
    schedule = while_(schedule, ({
      attempt
    }) => succeed$3(attempt <= options.times));
  }
  return schedule;
};
const TypeId$g = EffectTypeId;
const isEffect = (u) => typeof u === "object" && u !== null && TypeId$g in u;
const forEach = forEach$1;
const whileLoop = whileLoop$1;
const promise = promise$1;
const succeed = succeed$3;
const succeedNone = succeedNone$1;
const succeedSome = succeedSome$1;
const suspend = suspend$1;
const sync = sync$1;
const void_$1 = void_$2;
const callback = callback$1;
const never$1 = never$2;
const gen = gen$1;
const fail = fail$2;
const failCause$1 = failCause$3;
const withFiber = withFiber$1;
const flatMap = flatMap$1;
const andThen = andThen$1;
const exit = exit$1;
const map = map$1;
const catchCause = catchCause$1;
const catchFilter = catchFilter$1;
const orDie = orDie$1;
const tapCause = tapCause$1;
const retry = retry$1;
const ignore = ignore$1;
const timeout = timeout$1;
const timeoutOrElse = timeoutOrElse$1;
const delay = delay$1;
const sleep = sleep$1;
const raceFirst = raceFirst$1;
const matchCauseEffect = matchCauseEffect$1;
const services = services$1;
const servicesWith = servicesWith$1;
const provide = provide$1;
const provideServices$2 = provideServices$3;
const updateServices = updateServices$1;
const provideService = provideService$1;
const scoped = scoped$1;
const scopedWith = scopedWith$1;
const acquireRelease = acquireRelease$1;
const ensuring = ensuring$1;
const onError = onError$1;
const onExit = onExit$1;
const interrupt$1 = interrupt$3;
const interruptible = interruptible$1;
const onInterrupt = onInterrupt$1;
const forever = forever$2;
const makeSpanScoped = makeSpanScoped$1;
const useSpan = useSpan$1;
const withParentSpan = withParentSpan$1;
const forkIn = forkIn$1;
const forkScoped = forkScoped$1;
const runFork = runFork$1;
const runForkWith = runForkWith$1;
const runPromise = runPromise$1;
const runSync = runSync$1;
const runSyncExit = runSyncExit$1;
const fnUntraced = fnUntraced$1;
const logError = /* @__PURE__ */ logWithLevel("Error");
const annotateLogs = /* @__PURE__ */ dual((args2) => isEffect$1(args2[0]), (effect2, ...args2) => updateService(effect2, CurrentLogAnnotations, (annotations) => {
  const newAnnotations = {
    ...annotations
  };
  if (args2.length === 1) {
    Object.assign(newAnnotations, args2[0]);
  } else {
    newAnnotations[args2[0]] = args2[1];
  }
  return newAnnotations;
}));
const mapEager = mapEager$1;
const mapErrorEager = mapErrorEager$1;
const mapBothEager = mapBothEager$1;
const flatMapEager = flatMapEager$1;
const catchEager = catchEager$1;
const fnUntracedEager = fnUntracedEager$1;
function set(self, key, value) {
  if (key === "__proto__") {
    Object.defineProperty(self, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    self[key] = value;
  }
  return self;
}
function resolve(ast) {
  return ast.checks ? ast.checks[ast.checks.length - 1].annotations : ast.annotations;
}
function resolveAt(key) {
  return (ast) => resolve(ast)?.[key];
}
const resolveIdentifier = /* @__PURE__ */ resolveAt("identifier");
const getExpected = /* @__PURE__ */ memoize((ast) => {
  const identifier2 = resolveIdentifier(ast);
  if (typeof identifier2 === "string") return identifier2;
  return ast.getExpected(getExpected);
});
const escape = (string2) => string2.replace(/[/\\^$*+?.()|[\]{}]/g, "\\$&");
const redactedRegistry = /* @__PURE__ */ new WeakMap();
const TypeId$f = "~effect/data/Redacted";
const isRedacted = (u) => hasProperty(u, TypeId$f);
const make$b = (value, options) => {
  const self = Object.create(Proto$3);
  redactedRegistry.set(self, value);
  return self;
};
const Proto$3 = {
  [TypeId$f]: {
    _A: (_) => _
  },
  label: void 0,
  ...PipeInspectableProto,
  toJSON() {
    return this.toString();
  },
  toString() {
    return `<redacted${isString(this.label) ? ":" + this.label : ""}>`;
  },
  [symbol$2]() {
    return hash(redactedRegistry.get(this));
  },
  [symbol$1](that) {
    return isRedacted(that) && equals$1(redactedRegistry.get(this), redactedRegistry.get(that));
  }
};
const TypeId$e = "~effect/SchemaIssue/Issue";
function isIssue(u) {
  return hasProperty(u, TypeId$e);
}
let Base$1 = class Base {
  [TypeId$e] = TypeId$e;
  toString() {
    return defaultFormatter(this);
  }
};
let Filter$1 = class Filter extends Base$1 {
  _tag = "Filter";
  /**
   * The input value that caused the issue.
   */
  actual;
  /**
   * The filter that failed.
   */
  filter;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(actual, filter2, issue) {
    super();
    this.actual = actual;
    this.filter = filter2;
    this.issue = issue;
  }
};
class Encoding extends Base$1 {
  _tag = "Encoding";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The input value that caused the issue.
   */
  actual;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(ast, actual, issue) {
    super();
    this.ast = ast;
    this.actual = actual;
    this.issue = issue;
  }
}
class Pointer extends Base$1 {
  _tag = "Pointer";
  /**
   * The path to the location in the input that caused the issue.
   */
  path;
  /**
   * The issue that occurred.
   */
  issue;
  constructor(path, issue) {
    super();
    this.path = path;
    this.issue = issue;
  }
}
class MissingKey extends Base$1 {
  _tag = "MissingKey";
  /**
   * The metadata for the issue.
   */
  annotations;
  constructor(annotations) {
    super();
    this.annotations = annotations;
  }
}
class UnexpectedKey extends Base$1 {
  _tag = "UnexpectedKey";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The input value that caused the issue.
   */
  actual;
  constructor(ast, actual) {
    super();
    this.ast = ast;
    this.actual = actual;
  }
}
class Composite extends Base$1 {
  _tag = "Composite";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The input value that caused the issue.
   */
  actual;
  /**
   * The issues that occurred.
   */
  issues;
  constructor(ast, actual, issues) {
    super();
    this.ast = ast;
    this.actual = actual;
    this.issues = issues;
  }
}
class InvalidType extends Base$1 {
  _tag = "InvalidType";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The input value that caused the issue.
   */
  actual;
  constructor(ast, actual) {
    super();
    this.ast = ast;
    this.actual = actual;
  }
}
class InvalidValue extends Base$1 {
  _tag = "InvalidValue";
  /**
   * The value that caused the issue.
   */
  actual;
  /**
   * The metadata for the issue.
   */
  annotations;
  constructor(actual, annotations) {
    super();
    this.actual = actual;
    this.annotations = annotations;
  }
}
class AnyOf extends Base$1 {
  _tag = "AnyOf";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The input value that caused the issue.
   */
  actual;
  /**
   * The issues that occurred.
   */
  issues;
  constructor(ast, actual, issues) {
    super();
    this.ast = ast;
    this.actual = actual;
    this.issues = issues;
  }
}
class OneOf extends Base$1 {
  _tag = "OneOf";
  /**
   * The schema that caused the issue.
   */
  ast;
  /**
   * The input value that caused the issue.
   */
  actual;
  /**
   * The schemas that were successful.
   */
  successes;
  constructor(ast, actual, successes) {
    super();
    this.ast = ast;
    this.actual = actual;
    this.successes = successes;
  }
}
function make$a(input, out) {
  if (isIssue(out)) {
    return out;
  }
  if (out === void 0) {
    return void 0;
  }
  if (typeof out === "boolean") {
    return out ? void 0 : new InvalidValue(some(input));
  }
  if (typeof out === "string") {
    return new InvalidValue(some(input), {
      message: out
    });
  }
  return new Pointer(out.path, new InvalidValue(some(input), {
    message: out.message
  }));
}
const defaultLeafHook = (issue) => {
  const message = findMessage(issue);
  if (message !== void 0) return message;
  switch (issue._tag) {
    case "InvalidType":
      return getExpectedMessage(getExpected(issue.ast), formatOption(issue.actual));
    case "InvalidValue":
      return `Invalid data ${formatOption(issue.actual)}`;
    case "MissingKey":
      return "Missing key";
    case "UnexpectedKey":
      return `Unexpected key with value ${format(issue.actual)}`;
    case "Forbidden":
      return "Forbidden operation";
    case "OneOf":
      return `Expected exactly one member to match the input ${format(issue.actual)}`;
  }
};
const defaultCheckHook = (issue) => {
  return findMessage(issue.issue) ?? findMessage(issue);
};
function getExpectedMessage(expected, actual) {
  return `Expected ${expected}, got ${actual}`;
}
function toDefaultIssues(issue, path, leafHook, checkHook) {
  switch (issue._tag) {
    case "Filter": {
      const message = checkHook(issue);
      if (message !== void 0) {
        return [{
          path,
          message
        }];
      }
      switch (issue.issue._tag) {
        case "InvalidValue":
          return [{
            path,
            message: getExpectedMessage(formatCheck(issue.filter), format(issue.actual))
          }];
        default:
          return toDefaultIssues(issue.issue, path, leafHook, checkHook);
      }
    }
    case "Encoding":
      return toDefaultIssues(issue.issue, path, leafHook, checkHook);
    case "Pointer":
      return toDefaultIssues(issue.issue, [...path, ...issue.path], leafHook, checkHook);
    case "Composite":
      return issue.issues.flatMap((issue2) => toDefaultIssues(issue2, path, leafHook, checkHook));
    case "AnyOf": {
      const message = findMessage(issue);
      if (issue.issues.length === 0) {
        if (message !== void 0) return [{
          path,
          message
        }];
        const expected = getExpectedMessage(getExpected(issue.ast), format(issue.actual));
        return [{
          path,
          message: expected
        }];
      }
      return issue.issues.flatMap((issue2) => toDefaultIssues(issue2, path, leafHook, checkHook));
    }
    default:
      return [{
        path,
        message: leafHook(issue)
      }];
  }
}
function formatCheck(check) {
  const expected = check.annotations?.expected;
  if (typeof expected === "string") return expected;
  switch (check._tag) {
    case "Filter":
      return "<filter>";
    case "FilterGroup":
      return check.checks.map((check2) => formatCheck(check2)).join(" & ");
  }
}
function makeFormatterDefault() {
  return (issue) => toDefaultIssues(issue, [], defaultLeafHook, defaultCheckHook).map(formatDefaultIssue).join("\n");
}
const defaultFormatter = /* @__PURE__ */ makeFormatterDefault();
function formatDefaultIssue(issue) {
  let out = issue.message;
  if (issue.path && issue.path.length > 0) {
    const path = formatPath(issue.path);
    out += `
  at ${path}`;
  }
  return out;
}
function findMessage(issue) {
  switch (issue._tag) {
    case "InvalidType":
    case "OneOf":
    case "Composite":
    case "AnyOf":
      return getMessageAnnotation(issue.ast.annotations);
    case "InvalidValue":
    case "Forbidden":
      return getMessageAnnotation(issue.annotations);
    case "MissingKey":
      return getMessageAnnotation(issue.annotations, "messageMissingKey");
    case "UnexpectedKey":
      return getMessageAnnotation(issue.ast.annotations, "messageUnexpectedKey");
    case "Filter":
      return getMessageAnnotation(issue.filter.annotations);
    case "Encoding":
      return findMessage(issue.issue);
  }
}
function getMessageAnnotation(annotations, type = "message") {
  const message = annotations?.[type];
  if (typeof message === "string") return message;
}
function formatOption(actual) {
  if (isNone(actual)) return "no value provided";
  return format(actual.value);
}
class Getter extends Class$2 {
  run;
  constructor(run2) {
    super();
    this.run = run2;
  }
  map(f) {
    return new Getter((oe, options) => this.run(oe, options).pipe(mapEager(map$2(f))));
  }
  compose(other) {
    if (isPassthrough(this)) {
      return other;
    }
    if (isPassthrough(other)) {
      return this;
    }
    return new Getter((oe, options) => this.run(oe, options).pipe(flatMapEager((ot) => other.run(ot, options))));
  }
}
const passthrough_$1 = /* @__PURE__ */ new Getter(succeed);
function isPassthrough(getter) {
  return getter.run === passthrough_$1.run;
}
function passthrough$1() {
  return passthrough_$1;
}
function transform$1(f) {
  return transformOptional(map$2(f));
}
function transformOptional(f) {
  return new Getter((oe) => succeed(f(oe)));
}
function String$3() {
  return transform$1(globalThis.String);
}
function Number$3() {
  return transform$1(globalThis.Number);
}
const TypeId$d = "~effect/SchemaTransformation/Transformation";
class Transformation {
  [TypeId$d] = TypeId$d;
  _tag = "Transformation";
  decode;
  encode;
  constructor(decode, encode) {
    this.decode = decode;
    this.encode = encode;
  }
  flip() {
    return new Transformation(this.encode, this.decode);
  }
  compose(other) {
    return new Transformation(this.decode.compose(other.decode), other.encode.compose(this.encode));
  }
}
function isTransformation(u) {
  return hasProperty(u, TypeId$d);
}
const make$9 = (options) => {
  if (isTransformation(options)) {
    return options;
  }
  return new Transformation(options.decode, options.encode);
};
function transform(options) {
  return new Transformation(transform$1(options.decode), transform$1(options.encode));
}
const passthrough_ = /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough$1(), /* @__PURE__ */ passthrough$1());
function passthrough() {
  return passthrough_;
}
const numberFromString = /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number$3(), /* @__PURE__ */ String$3());
const errorFromErrorJsonEncoded = (options) => transform({
  decode: (i) => {
    const err = new Error(i.message);
    if (typeof i.name === "string" && i.name !== "Error") err.name = i.name;
    if (typeof i.stack === "string") err.stack = i.stack;
    return err;
  },
  encode: (a) => {
    const e = {
      name: a.name,
      message: a.message
    };
    if (options?.includeStack && typeof a.stack === "string") {
      e.stack = a.stack;
    }
    return e;
  }
});
function makeGuard(tag2) {
  return (ast) => ast._tag === tag2;
}
const isDeclaration = /* @__PURE__ */ makeGuard("Declaration");
const isNever = /* @__PURE__ */ makeGuard("Never");
const isLiteral = /* @__PURE__ */ makeGuard("Literal");
const isUniqueSymbol = /* @__PURE__ */ makeGuard("UniqueSymbol");
const isArrays = /* @__PURE__ */ makeGuard("Arrays");
const isObjects = /* @__PURE__ */ makeGuard("Objects");
const isUnion = /* @__PURE__ */ makeGuard("Union");
class Link {
  to;
  transformation;
  constructor(to, transformation) {
    this.to = to;
    this.transformation = transformation;
  }
}
const defaultParseOptions = {};
class Context {
  isOptional;
  isMutable;
  /** Used for constructor default values (e.g. `withConstructorDefault` API) */
  defaultValue;
  annotations;
  constructor(isOptional2, isMutable, defaultValue = void 0, annotations = void 0) {
    this.isOptional = isOptional2;
    this.isMutable = isMutable;
    this.defaultValue = defaultValue;
    this.annotations = annotations;
  }
}
const TypeId$c = "~effect/Schema";
class Base2 {
  [TypeId$c] = TypeId$c;
  annotations;
  checks;
  encoding;
  context;
  constructor(annotations = void 0, checks = void 0, encoding = void 0, context = void 0) {
    this.annotations = annotations;
    this.checks = checks;
    this.encoding = encoding;
    this.context = context;
  }
  toString() {
    return `<${this._tag}>`;
  }
}
class Declaration extends Base2 {
  _tag = "Declaration";
  typeParameters;
  run;
  constructor(typeParameters, run2, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    this.typeParameters = typeParameters;
    this.run = run2;
  }
  /** @internal */
  getParser() {
    const run2 = this.run(this.typeParameters);
    return (oinput, options) => {
      if (isNone(oinput)) return succeedNone;
      return mapEager(run2(oinput.value, this, options), some);
    };
  }
  /** @internal */
  recur(recur2) {
    const tps = mapOrSame(this.typeParameters, recur2);
    return tps === this.typeParameters ? this : new Declaration(tps, this.run, this.annotations, this.checks, void 0, this.context);
  }
  /** @internal */
  getExpected() {
    const expected = this.annotations?.expected;
    if (typeof expected === "string") return expected;
    return "<Declaration>";
  }
}
let Null$1 = class Null extends Base2 {
  _tag = "Null";
  /** @internal */
  getParser() {
    return fromConst(this, null);
  }
  /** @internal */
  getExpected() {
    return "null";
  }
};
const null_ = /* @__PURE__ */ new Null$1();
let Undefined$1 = class Undefined extends Base2 {
  _tag = "Undefined";
  /** @internal */
  getParser() {
    return fromConst(this, void 0);
  }
  /** @internal */
  toCodecJson() {
    return replaceEncoding(this, [undefinedToNull]);
  }
  /** @internal */
  getExpected() {
    return "undefined";
  }
};
const undefinedToNull = /* @__PURE__ */ new Link(null_, /* @__PURE__ */ new Transformation(/* @__PURE__ */ transform$1(() => void 0), /* @__PURE__ */ transform$1(() => null)));
const undefined_ = /* @__PURE__ */ new Undefined$1();
let Void$1 = class Void extends Base2 {
  _tag = "Void";
  /** @internal */
  getParser() {
    return fromConst(this, void 0);
  }
  /** @internal */
  toCodecJson() {
    return replaceEncoding(this, [undefinedToNull]);
  }
  /** @internal */
  getExpected() {
    return "void";
  }
};
const void_ = /* @__PURE__ */ new Void$1();
let Never$1 = class Never extends Base2 {
  _tag = "Never";
  /** @internal */
  getParser() {
    return fromRefinement(this, isNever$1);
  }
  /** @internal */
  getExpected() {
    return "never";
  }
};
const never = /* @__PURE__ */ new Never$1();
let Any$1 = class Any extends Base2 {
  _tag = "Any";
  /** @internal */
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  /** @internal */
  getExpected() {
    return "any";
  }
};
const any = /* @__PURE__ */ new Any$1();
let Unknown$1 = class Unknown extends Base2 {
  _tag = "Unknown";
  /** @internal */
  getParser() {
    return fromRefinement(this, isUnknown);
  }
  /** @internal */
  getExpected() {
    return "unknown";
  }
};
const unknown = /* @__PURE__ */ new Unknown$1();
let Literal$1 = class Literal extends Base2 {
  _tag = "Literal";
  literal;
  constructor(literal, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    if (typeof literal === "number" && !globalThis.Number.isFinite(literal)) {
      throw new Error(`A numeric literal must be finite, got ${format(literal)}`);
    }
    this.literal = literal;
  }
  /** @internal */
  getParser() {
    return fromConst(this, this.literal);
  }
  /** @internal */
  toCodecJson() {
    return typeof this.literal === "bigint" ? literalToString(this) : this;
  }
  /** @internal */
  toCodecStringTree() {
    return typeof this.literal === "string" ? this : literalToString(this);
  }
  /** @internal */
  getExpected() {
    return typeof this.literal === "string" ? JSON.stringify(this.literal) : globalThis.String(this.literal);
  }
};
function literalToString(ast) {
  const literalAsString = globalThis.String(ast.literal);
  return replaceEncoding(ast, [new Link(new Literal$1(literalAsString), new Transformation(transform$1(() => ast.literal), transform$1(() => literalAsString)))]);
}
let String$2 = class String2 extends Base2 {
  _tag = "String";
  /** @internal */
  getParser() {
    return fromRefinement(this, isString);
  }
  /** @internal */
  getExpected() {
    return "string";
  }
};
const string = /* @__PURE__ */ new String$2();
let Number$2 = class Number2 extends Base2 {
  _tag = "Number";
  /** @internal */
  getParser() {
    return fromRefinement(this, isNumber);
  }
  /** @internal */
  toCodecJson() {
    if (this.checks && (hasCheck(this.checks, "isFinite") || hasCheck(this.checks, "isInt"))) {
      return this;
    }
    return replaceEncoding(this, [numberToJson]);
  }
  /** @internal */
  toCodecStringTree() {
    if (this.checks && (hasCheck(this.checks, "isFinite") || hasCheck(this.checks, "isInt"))) {
      return replaceEncoding(this, [finiteToString]);
    }
    return replaceEncoding(this, [numberToString]);
  }
  /** @internal */
  getExpected() {
    return "number";
  }
};
function hasCheck(checks, tag2) {
  return checks.some((c) => {
    switch (c._tag) {
      case "Filter":
        return c.annotations?.meta?._tag === tag2;
      case "FilterGroup":
        return hasCheck(c.checks, tag2);
    }
  });
}
const number = /* @__PURE__ */ new Number$2();
let Boolean$2 = class Boolean extends Base2 {
  _tag = "Boolean";
  /** @internal */
  getParser() {
    return fromRefinement(this, isBoolean);
  }
  /** @internal */
  getExpected() {
    return "boolean";
  }
};
const boolean = /* @__PURE__ */ new Boolean$2();
class Arrays extends Base2 {
  _tag = "Arrays";
  isMutable;
  elements;
  rest;
  constructor(isMutable, elements, rest, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    this.isMutable = isMutable;
    this.elements = elements;
    this.rest = rest;
    const i = elements.findIndex(isOptional);
    if (i !== -1 && (elements.slice(i + 1).some((e) => !isOptional(e)) || rest.length > 1)) {
      throw new Error("A required element cannot follow an optional element. ts(1257)");
    }
    if (rest.length > 1 && rest.slice(1).some(isOptional)) {
      throw new Error("An optional element cannot follow a rest element. ts(1266)");
    }
  }
  /** @internal */
  getParser(recur2) {
    const ast = this;
    const elements = ast.elements.map((ast2) => ({
      ast: ast2,
      parser: recur2(ast2)
    }));
    const rest = ast.rest.map((ast2) => ({
      ast: ast2,
      parser: recur2(ast2)
    }));
    const elementLen = elements.length;
    return fnUntracedEager(function* (oinput, options) {
      if (oinput._tag === "None") {
        return oinput;
      }
      const input = oinput.value;
      if (!Array.isArray(input)) {
        return yield* fail(new InvalidType(ast, oinput));
      }
      const output = [];
      let issues;
      const errorsAllOption = options.errors === "all";
      let i = 0;
      for (; i < elementLen; i++) {
        const e = elements[i];
        const value = i < input.length ? some(input[i]) : none();
        const eff = e.parser(value, options);
        const exit$12 = effectIsExit(eff) ? eff : yield* exit(eff);
        if (exit$12._tag === "Failure") {
          const issueElement = findError(exit$12.cause);
          if (isFailure$1(issueElement)) {
            return yield* exit$12;
          }
          const issue = new Pointer([i], issueElement.success);
          if (errorsAllOption) {
            if (issues) issues.push(issue);
            else issues = [issue];
          } else {
            return yield* fail(new Composite(ast, oinput, [issue]));
          }
        } else if (exit$12.value._tag === "Some") {
          output[i] = exit$12.value.value;
        } else if (!isOptional(e.ast)) {
          const issue = new Pointer([i], new MissingKey(e.ast.context?.annotations));
          if (errorsAllOption) {
            if (issues) issues.push(issue);
            else issues = [issue];
          } else {
            return yield* fail(new Composite(ast, oinput, [issue]));
          }
        }
      }
      const len = input.length;
      if (ast.rest.length > 0) {
        const [head, ...tail] = rest;
        const keyAnnotations = head.ast.context?.annotations;
        for (; i < len - tail.length; i++) {
          const eff = head.parser(some(input[i]), options);
          const exit$12 = effectIsExit(eff) ? eff : yield* exit(eff);
          if (exit$12._tag === "Failure") {
            const issueRest = findError(exit$12.cause);
            if (isFailure$1(issueRest)) {
              return yield* exit$12;
            }
            const issue = new Pointer([i], issueRest.success);
            if (errorsAllOption) {
              if (issues) issues.push(issue);
              else issues = [issue];
            } else {
              return yield* fail(new Composite(ast, oinput, [issue]));
            }
          } else if (exit$12.value._tag === "Some") {
            output[i] = exit$12.value.value;
          } else {
            const issue = new Pointer([i], new MissingKey(keyAnnotations));
            if (errorsAllOption) {
              if (issues) issues.push(issue);
              else issues = [issue];
            } else {
              return yield* fail(new Composite(ast, oinput, [issue]));
            }
          }
        }
        for (let j = 0; j < tail.length; j++) {
          const index = i + j;
          if (len < index) {
            continue;
          } else {
            const tailj = tail[j];
            const keyAnnotations2 = tailj.ast.context?.annotations;
            const eff = tailj.parser(some(input[index]), options);
            const exit$12 = effectIsExit(eff) ? eff : yield* exit(eff);
            if (exit$12._tag === "Failure") {
              const issueRest = findError(exit$12.cause);
              if (isFailure$1(issueRest)) {
                return yield* exit$12;
              }
              const issue = new Pointer([index], issueRest.success);
              if (errorsAllOption) {
                if (issues) issues.push(issue);
                else issues = [issue];
              } else {
                return yield* fail(new Composite(ast, oinput, [issue]));
              }
            } else if (exit$12.value._tag === "Some") {
              output[index] = exit$12.value.value;
            } else {
              const issue = new Pointer([index], new MissingKey(keyAnnotations2));
              if (errorsAllOption) {
                if (issues) issues.push(issue);
                else issues = [issue];
              } else {
                return yield* fail(new Composite(ast, oinput, [issue]));
              }
            }
          }
        }
      } else {
        for (let i2 = elementLen; i2 <= len - 1; i2++) {
          const issue = new Pointer([i2], new UnexpectedKey(ast, input[i2]));
          if (errorsAllOption) {
            if (issues) issues.push(issue);
            else issues = [issue];
          } else {
            return yield* fail(new Composite(ast, oinput, [issue]));
          }
        }
      }
      if (issues) {
        return yield* fail(new Composite(ast, oinput, issues));
      }
      return some(output);
    });
  }
  /** @internal */
  recur(recur2) {
    const elements = mapOrSame(this.elements, recur2);
    const rest = mapOrSame(this.rest, recur2);
    return elements === this.elements && rest === this.rest ? this : new Arrays(this.isMutable, elements, rest, this.annotations, this.checks, void 0, this.context);
  }
  /** @internal */
  getExpected() {
    return "array";
  }
}
const FINITE_PATTERN = "[+-]?\\d*\\.?\\d+(?:[Ee][+-]?\\d+)?";
const isNumberStringRegExp = /* @__PURE__ */ new globalThis.RegExp(`(?:${FINITE_PATTERN}|Infinity|-Infinity|NaN)`);
function getIndexSignatureKeys(input, parameter) {
  const encoded = toEncoded(parameter);
  switch (encoded._tag) {
    case "String":
      return Object.keys(input);
    case "TemplateLiteral": {
      const regExp = getTemplateLiteralRegExp(encoded);
      return Object.keys(input).filter((k) => regExp.test(k));
    }
    case "Symbol":
      return Object.getOwnPropertySymbols(input);
    case "Number":
      return Object.keys(input).filter((k) => isNumberStringRegExp.test(k));
    case "Union":
      return [...new Set(encoded.types.flatMap((t) => getIndexSignatureKeys(input, t)))];
    default:
      return [];
  }
}
class PropertySignature {
  name;
  type;
  constructor(name, type) {
    this.name = name;
    this.type = type;
  }
}
class IndexSignature {
  parameter;
  type;
  merge;
  constructor(parameter, type, merge2) {
    this.parameter = parameter;
    this.type = type;
    this.merge = merge2;
    if (isOptional(type) && !containsUndefined(type)) {
      throw new Error("Cannot use `Schema.optionalKey` with index signatures, use `Schema.optional` instead.");
    }
  }
}
class Objects extends Base2 {
  _tag = "Objects";
  propertySignatures;
  indexSignatures;
  constructor(propertySignatures, indexSignatures, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    this.propertySignatures = propertySignatures;
    this.indexSignatures = indexSignatures;
    const duplicates = propertySignatures.map((ps) => ps.name).filter((name, i, arr) => arr.indexOf(name) !== i);
    if (duplicates.length > 0) {
      throw new Error(`Duplicate identifiers: ${JSON.stringify(duplicates)}. ts(2300)`);
    }
  }
  /** @internal */
  getParser(recur2) {
    const ast = this;
    const expectedKeys = [];
    const expectedKeysSet = /* @__PURE__ */ new Set();
    const properties = [];
    const propertyCount = ast.propertySignatures.length;
    for (const ps of ast.propertySignatures) {
      expectedKeys.push(ps.name);
      expectedKeysSet.add(ps.name);
      properties.push({
        ps,
        parser: recur2(ps.type),
        name: ps.name,
        type: ps.type
      });
    }
    const indexCount = ast.indexSignatures.length;
    if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
      return fromRefinement(ast, isNotNullish);
    }
    return fnUntracedEager(function* (oinput, options) {
      if (oinput._tag === "None") {
        return oinput;
      }
      const input = oinput.value;
      if (!(typeof input === "object" && input !== null && !Array.isArray(input))) {
        return yield* fail(new InvalidType(ast, oinput));
      }
      const out = {};
      let issues;
      const errorsAllOption = options.errors === "all";
      const onExcessPropertyError = options.onExcessProperty === "error";
      const onExcessPropertyPreserve = options.onExcessProperty === "preserve";
      let inputKeys;
      if (ast.indexSignatures.length === 0 && (onExcessPropertyError || onExcessPropertyPreserve)) {
        inputKeys = Reflect.ownKeys(input);
        for (let i = 0; i < inputKeys.length; i++) {
          const key = inputKeys[i];
          if (!expectedKeysSet.has(key)) {
            if (onExcessPropertyError) {
              const issue = new Pointer([key], new UnexpectedKey(ast, input[key]));
              if (errorsAllOption) {
                if (issues) {
                  issues.push(issue);
                } else {
                  issues = [issue];
                }
                continue;
              } else {
                return yield* fail(new Composite(ast, oinput, [issue]));
              }
            } else {
              set(out, key, input[key]);
            }
          }
        }
      }
      for (let i = 0; i < propertyCount; i++) {
        const p = properties[i];
        const value = Object.hasOwn(input, p.name) ? some(input[p.name]) : none();
        const eff = p.parser(value, options);
        const exit$12 = effectIsExit(eff) ? eff : yield* exit(eff);
        if (exit$12._tag === "Failure") {
          const issueProp = findError(exit$12.cause);
          if (isFailure$1(issueProp)) {
            return yield* exit$12;
          }
          const issue = new Pointer([p.name], issueProp.success);
          if (errorsAllOption) {
            if (issues) issues.push(issue);
            else issues = [issue];
            continue;
          } else {
            return yield* fail(new Composite(ast, oinput, [issue]));
          }
        } else if (exit$12.value._tag === "Some") {
          set(out, p.name, exit$12.value.value);
        } else if (!isOptional(p.type)) {
          const issue = new Pointer([p.name], new MissingKey(p.type.context?.annotations));
          if (errorsAllOption) {
            if (issues) issues.push(issue);
            else issues = [issue];
            continue;
          } else {
            return yield* fail(new Composite(ast, oinput, [issue]));
          }
        }
      }
      if (indexCount > 0) {
        for (let i = 0; i < indexCount; i++) {
          const is = ast.indexSignatures[i];
          const keys2 = getIndexSignatureKeys(input, is.parameter);
          for (let j = 0; j < keys2.length; j++) {
            const key = keys2[j];
            const parserKey = recur2(indexSignatureParameterFromString(is.parameter));
            const effKey = parserKey(some(key), options);
            const exitKey = effectIsExit(effKey) ? effKey : yield* exit(effKey);
            if (exitKey._tag === "Failure") {
              const issueKey = findError(exitKey.cause);
              if (isFailure$1(issueKey)) {
                return yield* exitKey;
              }
              const issue = new Pointer([key], issueKey.success);
              if (errorsAllOption) {
                if (issues) issues.push(issue);
                else issues = [issue];
                continue;
              }
              return yield* fail(new Composite(ast, oinput, [issue]));
            }
            const value = some(input[key]);
            const parserValue = recur2(is.type);
            const effValue = parserValue(value, options);
            const exitValue = effectIsExit(effValue) ? effValue : yield* exit(effValue);
            if (exitValue._tag === "Failure") {
              const issueValue = findError(exitValue.cause);
              if (isFailure$1(issueValue)) {
                return yield* exitValue;
              }
              const issue = new Pointer([key], issueValue.success);
              if (errorsAllOption) {
                if (issues) issues.push(issue);
                else issues = [issue];
                continue;
              } else {
                return yield* fail(new Composite(ast, oinput, [issue]));
              }
            } else if (exitKey.value._tag === "Some" && exitValue.value._tag === "Some") {
              const k2 = exitKey.value.value;
              const v2 = exitValue.value.value;
              if (is.merge && is.merge.decode && Object.hasOwn(out, k2)) {
                const [k, v] = is.merge.decode.combine([k2, out[k2]], [k2, v2]);
                set(out, k, v);
              } else {
                set(out, k2, v2);
              }
            }
          }
        }
      }
      if (issues) {
        return yield* fail(new Composite(ast, oinput, issues));
      }
      if (options.propertyOrder === "original") {
        const keys2 = (inputKeys ?? Reflect.ownKeys(input)).concat(expectedKeys);
        const preserved = {};
        for (const key of keys2) {
          if (Object.hasOwn(out, key)) {
            set(preserved, key, out[key]);
          }
        }
        return some(preserved);
      }
      return some(out);
    });
  }
  rebuild(recur2, flipMerge) {
    const props = mapOrSame(this.propertySignatures, (ps) => {
      const t = recur2(ps.type);
      return t === ps.type ? ps : new PropertySignature(ps.name, t);
    });
    const indexes = mapOrSame(this.indexSignatures, (is) => {
      const p = recur2(is.parameter);
      const t = recur2(is.type);
      const merge2 = flipMerge ? is.merge?.flip() : is.merge;
      return p === is.parameter && t === is.type && merge2 === is.merge ? is : new IndexSignature(p, t, merge2);
    });
    return props === this.propertySignatures && indexes === this.indexSignatures ? this : new Objects(props, indexes, this.annotations, this.checks, void 0, this.context);
  }
  /** @internal */
  flip(recur2) {
    return this.rebuild(recur2, true);
  }
  /** @internal */
  recur(recur2) {
    return this.rebuild(recur2, false);
  }
  /** @internal */
  getExpected() {
    if (this.propertySignatures.length === 0 && this.indexSignatures.length === 0) return "object | array";
    return "object";
  }
}
function struct(fields, checks, annotations) {
  return new Objects(Reflect.ownKeys(fields).map((key) => {
    return new PropertySignature(key, fields[key].ast);
  }), [], annotations, checks);
}
function getAST(self) {
  return self.ast;
}
function union(members, mode, checks) {
  return new Union$1(members.map(getAST), mode, void 0, checks);
}
function getCandidateTypes(ast) {
  switch (ast._tag) {
    case "Null":
      return ["null"];
    case "Undefined":
    case "Void":
      return ["undefined"];
    case "String":
    case "TemplateLiteral":
      return ["string"];
    case "Number":
      return ["number"];
    case "Boolean":
      return ["boolean"];
    case "Symbol":
    case "UniqueSymbol":
      return ["symbol"];
    case "BigInt":
      return ["bigint"];
    case "Arrays":
      return ["array"];
    case "ObjectKeyword":
      return ["object", "array", "function"];
    case "Objects":
      return ast.propertySignatures.length || ast.indexSignatures.length ? ["object"] : ["object", "array"];
    case "Enum":
      return Array.from(new Set(ast.enums.map(([, v]) => typeof v)));
    case "Literal":
      return [typeof ast.literal];
    case "Union":
      return Array.from(new Set(ast.types.flatMap(getCandidateTypes)));
    default:
      return ["null", "undefined", "string", "number", "boolean", "symbol", "bigint", "object", "array", "function"];
  }
}
function collectSentinels(ast) {
  switch (ast._tag) {
    default:
      return [];
    case "Declaration": {
      const s = ast.annotations?.["~sentinels"];
      return Array.isArray(s) ? s : [];
    }
    case "Objects":
      return ast.propertySignatures.flatMap((ps) => {
        const type = ps.type;
        if (!isOptional(type)) {
          if (isLiteral(type)) {
            return [{
              key: ps.name,
              literal: type.literal
            }];
          }
          if (isUniqueSymbol(type)) {
            return [{
              key: ps.name,
              literal: type.symbol
            }];
          }
        }
        return [];
      });
    case "Arrays":
      return ast.elements.flatMap((e, i) => {
        return isLiteral(e) && !isOptional(e) ? [{
          key: i,
          literal: e.literal
        }] : [];
      });
    case "Suspend":
      return collectSentinels(ast.thunk());
  }
}
const candidateIndexCache = /* @__PURE__ */ new WeakMap();
function getIndex(types) {
  let idx = candidateIndexCache.get(types);
  if (idx) return idx;
  idx = {};
  for (const a of types) {
    const encoded = toEncoded(a);
    if (isNever(encoded)) continue;
    const types2 = getCandidateTypes(encoded);
    const sentinels = collectSentinels(encoded);
    idx.byType ??= {};
    for (const t of types2) (idx.byType[t] ??= []).push(a);
    if (sentinels.length > 0) {
      idx.bySentinel ??= /* @__PURE__ */ new Map();
      for (const {
        key,
        literal
      } of sentinels) {
        let m = idx.bySentinel.get(key);
        if (!m) idx.bySentinel.set(key, m = /* @__PURE__ */ new Map());
        let arr = m.get(literal);
        if (!arr) m.set(literal, arr = []);
        arr.push(a);
      }
    } else {
      idx.otherwise ??= {};
      for (const t of types2) (idx.otherwise[t] ??= []).push(a);
    }
  }
  candidateIndexCache.set(types, idx);
  return idx;
}
function filterLiterals(input) {
  return (ast) => {
    const encoded = toEncoded(ast);
    return encoded._tag === "Literal" ? encoded.literal === input : encoded._tag === "UniqueSymbol" ? encoded.symbol === input : true;
  };
}
function getCandidates(input, types) {
  const idx = getIndex(types);
  const runtimeType = input === null ? "null" : Array.isArray(input) ? "array" : typeof input;
  if (idx.bySentinel) {
    const base = idx.otherwise?.[runtimeType] ?? [];
    if (runtimeType === "object" || runtimeType === "array") {
      for (const [k, m] of idx.bySentinel) {
        if (Object.hasOwn(input, k)) {
          const match2 = m.get(input[k]);
          if (match2) return [...match2, ...base].filter(filterLiterals(input));
        }
      }
    }
    return base;
  }
  return (idx.byType?.[runtimeType] ?? []).filter(filterLiterals(input));
}
let Union$1 = class Union extends Base2 {
  _tag = "Union";
  types;
  mode;
  constructor(types, mode, annotations, checks, encoding, context) {
    super(annotations, checks, encoding, context);
    this.types = types;
    this.mode = mode;
  }
  /** @internal */
  getParser(recur2) {
    const ast = this;
    return fnUntracedEager(function* (oinput, options) {
      if (oinput._tag === "None") {
        return oinput;
      }
      const input = oinput.value;
      const oneOf = ast.mode === "oneOf";
      const candidates = getCandidates(input, ast.types);
      let issues;
      const tracking = {
        out: void 0,
        successes: []
      };
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const parser = recur2(candidate);
        const eff = parser(oinput, options);
        const exit$12 = effectIsExit(eff) ? eff : yield* exit(eff);
        if (exit$12._tag === "Failure") {
          const issueResult = findError(exit$12.cause);
          if (isFailure$1(issueResult)) {
            return yield* exit$12;
          }
          if (issues) issues.push(issueResult.success);
          else issues = [issueResult.success];
          continue;
        } else {
          if (tracking.out && oneOf) {
            tracking.successes.push(candidate);
            return yield* fail(new OneOf(ast, input, tracking.successes));
          }
          tracking.out = exit$12.value;
          tracking.successes.push(candidate);
          if (!oneOf) {
            break;
          }
        }
      }
      if (tracking.out) {
        return tracking.out;
      } else {
        return yield* fail(new AnyOf(ast, input, issues ?? []));
      }
    });
  }
  /** @internal */
  recur(recur2) {
    const types = mapOrSame(this.types, recur2);
    return types === this.types ? this : new Union(types, this.mode, this.annotations, this.checks, void 0, this.context);
  }
  /** @internal */
  getExpected(getExpected2) {
    const expected = this.annotations?.expected;
    if (typeof expected === "string") return expected;
    if (this.types.length === 0) return "never";
    const types = this.types.map((type) => {
      const encoded = toEncoded(type);
      switch (encoded._tag) {
        case "Arrays": {
          const literals = encoded.elements.filter(isLiteral);
          if (literals.length > 0) {
            return `${formatIsMutable(encoded.isMutable)}[ ${literals.map((e) => getExpected2(e) + formatIsOptional(e.context?.isOptional)).join(", ")}, ... ]`;
          }
          break;
        }
        case "Objects": {
          const literals = encoded.propertySignatures.filter((ps) => isLiteral(ps.type));
          if (literals.length > 0) {
            return `{ ${literals.map((ps) => `${formatIsMutable(ps.type.context?.isMutable)}${formatPropertyKey(ps.name)}${formatIsOptional(ps.type.context?.isOptional)}: ${getExpected2(ps.type)}`).join(", ")}, ... }`;
          }
          break;
        }
      }
      return getExpected2(encoded);
    });
    return Array.from(new Set(types)).join(" | ");
  }
};
const nonFiniteLiterals = /* @__PURE__ */ new Union$1([/* @__PURE__ */ new Literal$1("Infinity"), /* @__PURE__ */ new Literal$1("-Infinity"), /* @__PURE__ */ new Literal$1("NaN")], "anyOf");
const numberToJson = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union$1([number, nonFiniteLiterals], "anyOf"), /* @__PURE__ */ new Transformation(/* @__PURE__ */ Number$3(), /* @__PURE__ */ transform$1((n) => globalThis.Number.isFinite(n) ? n : globalThis.String(n))));
function formatIsMutable(isMutable) {
  return isMutable ? "" : "readonly ";
}
function formatIsOptional(isOptional2) {
  return isOptional2 ? "?" : "";
}
class Filter2 extends Class$2 {
  _tag = "Filter";
  run;
  annotations;
  /**
   * Whether the parsing process should be aborted after this check has failed.
   */
  aborted;
  constructor(run2, annotations = void 0, aborted = false) {
    super();
    this.run = run2;
    this.annotations = annotations;
    this.aborted = aborted;
  }
  annotate(annotations) {
    return new Filter2(this.run, {
      ...this.annotations,
      ...annotations
    }, this.aborted);
  }
  abort() {
    return new Filter2(this.run, this.annotations, true);
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
}
class FilterGroup extends Class$2 {
  _tag = "FilterGroup";
  checks;
  annotations;
  constructor(checks, annotations = void 0) {
    super();
    this.checks = checks;
    this.annotations = annotations;
  }
  annotate(annotations) {
    return new FilterGroup(this.checks, {
      ...this.annotations,
      ...annotations
    });
  }
  and(other, annotations) {
    return new FilterGroup([this, other], annotations);
  }
}
function makeFilter$1(filter2, annotations, aborted = false) {
  return new Filter2((input, ast, options) => make$a(input, filter2(input, ast, options)), annotations, aborted);
}
function isPattern(regExp, annotations) {
  const source = regExp.source;
  return makeFilter$1((s) => regExp.test(s), {
    expected: `a string matching the RegExp ${source}`,
    meta: {
      _tag: "isPattern",
      regExp
    },
    toArbitraryConstraint: {
      string: {
        patterns: [regExp.source]
      }
    },
    ...annotations
  });
}
function modifyOwnPropertyDescriptors(ast, f) {
  const d = Object.getOwnPropertyDescriptors(ast);
  f(d);
  return Object.create(Object.getPrototypeOf(ast), d);
}
function replaceEncoding(ast, encoding) {
  if (ast.encoding === encoding) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.encoding.value = encoding;
  });
}
function replaceContext(ast, context) {
  if (ast.context === context) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.context.value = context;
  });
}
function annotate(ast, annotations) {
  if (ast.checks) {
    const last = ast.checks[ast.checks.length - 1];
    return replaceChecks(ast, append$1(ast.checks.slice(0, -1), last.annotate(annotations)));
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.annotations.value = {
      ...d.annotations.value,
      ...annotations
    };
  });
}
function replaceChecks(ast, checks) {
  if (ast.checks === checks) {
    return ast;
  }
  return modifyOwnPropertyDescriptors(ast, (d) => {
    d.checks.value = checks;
  });
}
function appendChecks(ast, checks) {
  return replaceChecks(ast, ast.checks ? [...ast.checks, ...checks] : checks);
}
function updateLastLink(encoding, f) {
  const links = encoding;
  const last = links[links.length - 1];
  const to = f(last.to);
  if (to !== last.to) {
    return append$1(encoding.slice(0, encoding.length - 1), new Link(to, last.transformation));
  }
  return encoding;
}
function applyToLastLink(f) {
  return (ast) => ast.encoding ? replaceEncoding(ast, updateLastLink(ast.encoding, f)) : ast;
}
function appendTransformation(from, transformation, to) {
  const link2 = new Link(from, transformation);
  return replaceEncoding(to, to.encoding ? [...to.encoding, link2] : [link2]);
}
function mapOrSame(as2, f) {
  let changed = false;
  const out = new Array(as2.length);
  for (let i = 0; i < as2.length; i++) {
    const a = as2[i];
    const fa = f(a);
    if (fa !== a) {
      changed = true;
    }
    out[i] = fa;
  }
  return changed ? out : as2;
}
function annotateKey(ast, annotations) {
  const context = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, ast.context.defaultValue, {
    ...ast.context.annotations,
    ...annotations
  }) : new Context(false, false, void 0, annotations);
  return replaceContext(ast, context);
}
const optionalKeyLastLink = /* @__PURE__ */ applyToLastLink(optionalKey$1);
function optionalKey$1(ast) {
  const context = ast.context ? ast.context.isOptional === false ? new Context(true, ast.context.isMutable, ast.context.defaultValue, ast.context.annotations) : ast.context : new Context(true, false);
  return optionalKeyLastLink(replaceContext(ast, context));
}
function withConstructorDefault$1(ast, defaultValue) {
  const transformation = new Transformation(new Getter((o) => {
    if (isNone(filter(o, isNotUndefined))) {
      const oe = defaultValue(o);
      return isEffect(oe) ? oe : succeed(oe);
    } else {
      return succeed(o);
    }
  }), passthrough$1());
  const encoding = [new Link(unknown, transformation)];
  const context = ast.context ? new Context(ast.context.isOptional, ast.context.isMutable, encoding, ast.context.annotations) : new Context(false, false, encoding);
  return replaceContext(ast, context);
}
function decodeTo$1(from, to, transformation) {
  return appendTransformation(from, transformation, to);
}
function isOptional(ast) {
  return ast.context?.isOptional ?? false;
}
const toType = /* @__PURE__ */ memoize((ast) => {
  if (ast.encoding) {
    return toType(replaceEncoding(ast, void 0));
  }
  const out = ast;
  return out.recur?.(toType) ?? out;
});
const toEncoded = /* @__PURE__ */ memoize((ast) => {
  return toType(flip(ast));
});
function flipEncoding(ast, encoding) {
  const links = encoding;
  const len = links.length;
  const last = links[len - 1];
  const ls = [new Link(flip(replaceEncoding(ast, void 0)), links[0].transformation.flip())];
  for (let i = 1; i < len; i++) {
    ls.unshift(new Link(flip(links[i - 1].to), links[i].transformation.flip()));
  }
  const to = flip(last.to);
  if (to.encoding) {
    return replaceEncoding(to, [...to.encoding, ...ls]);
  } else {
    return replaceEncoding(to, ls);
  }
}
const flip = /* @__PURE__ */ memoize((ast) => {
  if (ast.encoding) {
    return flipEncoding(ast, ast.encoding);
  }
  const out = ast;
  return out.flip?.(flip) ?? out.recur?.(flip) ?? out;
});
function containsUndefined(ast) {
  switch (ast._tag) {
    case "Undefined":
      return true;
    case "Union":
      return ast.types.some(containsUndefined);
    default:
      return false;
  }
}
function getTemplateLiteralSource(ast, top) {
  return ast.encodedParts.map((part) => handleTemplateLiteralASTPartParens(part, getTemplateLiteralASTPartPattern(part), top)).join("");
}
const getTemplateLiteralRegExp = /* @__PURE__ */ memoize((ast) => {
  return new globalThis.RegExp(`^${getTemplateLiteralSource(ast, true)}$`);
});
function getTemplateLiteralASTPartPattern(part) {
  switch (part._tag) {
    case "Literal":
      return escape(globalThis.String(part.literal));
    case "String":
      return STRING_PATTERN;
    case "Number":
      return FINITE_PATTERN;
    case "BigInt":
      return BIGINT_PATTERN;
    case "TemplateLiteral":
      return getTemplateLiteralSource(part, false);
    case "Union":
      return part.types.map(getTemplateLiteralASTPartPattern).join("|");
  }
}
function handleTemplateLiteralASTPartParens(part, s, top) {
  if (isUnion(part)) {
    if (!top) {
      return `(?:${s})`;
    }
  } else if (!top) {
    return s;
  }
  return `(${s})`;
}
function fromConst(ast, value) {
  const succeed2 = succeedSome(value);
  return (oinput) => {
    if (oinput._tag === "None") {
      return succeedNone;
    }
    return oinput.value === value ? succeed2 : fail(new InvalidType(ast, oinput));
  };
}
function fromRefinement(ast, refinement) {
  return (oinput) => {
    if (oinput._tag === "None") {
      return succeedNone;
    }
    return refinement(oinput.value) ? succeed(oinput) : fail(new InvalidType(ast, oinput));
  };
}
function toCodec(f) {
  function out(ast) {
    return ast.encoding ? replaceEncoding(ast, updateLastLink(ast.encoding, out)) : f(ast);
  }
  return memoize(out);
}
const indexSignatureParameterFromString = /* @__PURE__ */ toCodec((ast) => {
  switch (ast._tag) {
    default:
      return ast;
    case "Number":
      return ast.toCodecStringTree();
    case "Union":
      return ast.recur(indexSignatureParameterFromString);
  }
});
const STRING_PATTERN = "[\\s\\S]*?";
const isStringFiniteRegExp = /* @__PURE__ */ new globalThis.RegExp(`^${FINITE_PATTERN}$`);
function isStringFinite(annotations) {
  return isPattern(isStringFiniteRegExp, {
    expected: "a string representing a finite number",
    meta: {
      _tag: "isStringFinite",
      regExp: isStringFiniteRegExp
    },
    ...annotations
  });
}
const finiteString = /* @__PURE__ */ appendChecks(string, [/* @__PURE__ */ isStringFinite()]);
const finiteToString = /* @__PURE__ */ new Link(finiteString, numberFromString);
const numberToString = /* @__PURE__ */ new Link(/* @__PURE__ */ new Union$1([finiteString, nonFiniteLiterals], "anyOf"), numberFromString);
const BIGINT_PATTERN = "-?\\d+";
function collectIssues(checks, value, issues, ast, options) {
  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    if (check._tag === "FilterGroup") {
      collectIssues(check.checks, value, issues, ast, options);
    } else {
      const issue = check.run(value, ast, options);
      if (issue) {
        issues.push(new Filter$1(value, check, issue));
        if (check.aborted || options?.errors !== "all") {
          return;
        }
      }
    }
  }
}
const ClassTypeId = "~effect/Schema/Class";
const STRUCTURAL_ANNOTATION_KEY = "~structural";
function isJson(u) {
  const seen = /* @__PURE__ */ new Set();
  return recur2(u);
  function recur2(u2) {
    if (u2 === null || typeof u2 === "string" || typeof u2 === "boolean") {
      return true;
    }
    if (typeof u2 === "number") {
      return globalThis.Number.isFinite(u2);
    }
    if (typeof u2 !== "object" || u2 === void 0) {
      return false;
    }
    if (seen.has(u2)) {
      return false;
    }
    seen.add(u2);
    if (Array.isArray(u2)) {
      return u2.every(recur2);
    }
    return Object.keys(u2).every((key) => recur2(u2[key]));
  }
}
const Json = /* @__PURE__ */ new Declaration([], () => (input, ast) => isJson(input) ? succeed(input) : fail(new InvalidType(ast, some(input))), {
  typeConstructor: {
    _tag: "effect/Json"
  },
  generation: {
    runtime: `Schema.Json`,
    Type: `Schema.Json`
  },
  expected: "JSON value",
  toCodecJson: () => new Link(unknown, passthrough())
});
const unknownToNull = /* @__PURE__ */ new Link(null_, /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough$1(), /* @__PURE__ */ transform$1(() => null)));
const unknownToJson = /* @__PURE__ */ new Link(Json, /* @__PURE__ */ passthrough());
const interrupt = fiberInterrupt;
const interruptAll = fiberInterruptAll;
const getCurrent = getCurrentFiber;
const makeUnsafe$3 = makeLatchUnsafe;
const Empty = /* @__PURE__ */ Symbol.for("effect/MutableList/Empty");
const make$8 = () => ({
  head: void 0,
  tail: void 0,
  length: 0
});
const emptyBucket = () => ({
  array: [],
  mutable: true,
  offset: 0,
  next: void 0
});
const append = (self, message) => {
  if (!self.tail) {
    self.head = self.tail = emptyBucket();
  } else if (!self.tail.mutable) {
    self.tail.next = emptyBucket();
    self.tail = self.tail.next;
  }
  self.tail.array.push(message);
  self.length++;
};
const appendAll = (self, messages) => appendAllUnsafe(self, fromIterable(messages), !Array.isArray(messages));
const appendAllUnsafe = (self, messages, mutable = false) => {
  const chunk = {
    array: messages,
    mutable,
    offset: 0,
    next: void 0
  };
  if (self.head) {
    self.tail = self.tail.next = chunk;
  } else {
    self.head = self.tail = chunk;
  }
  self.length += messages.length;
  return messages.length;
};
const clear = (self) => {
  self.head = self.tail = void 0;
  self.length = 0;
};
const takeN = (self, n) => {
  if (n <= 0 || !self.head) return [];
  n = Math.min(n, self.length);
  if (n === self.length && self.head?.offset === 0 && !self.head.next) {
    const array3 = self.head.array;
    clear(self);
    return array3;
  }
  const array2 = new Array(n);
  let index = 0;
  let chunk = self.head;
  while (chunk) {
    while (chunk.offset < chunk.array.length) {
      array2[index++] = chunk.array[chunk.offset];
      if (chunk.mutable) chunk.array[chunk.offset] = void 0;
      chunk.offset++;
      if (index === n) {
        self.head = chunk;
        self.length -= n;
        if (self.length === 0) clear(self);
        return array2;
      }
    }
    chunk = chunk.next;
  }
  clear(self);
  return array2;
};
const take = (self) => {
  if (!self.head) return Empty;
  const message = self.head.array[self.head.offset];
  if (self.head.mutable) self.head.array[self.head.offset] = void 0;
  self.head.offset++;
  self.length--;
  if (self.head.offset === self.head.array.length) {
    if (self.head.next) {
      self.head = self.head.next;
    } else {
      clear(self);
    }
  }
  return message;
};
const TypeId$b = "~effect/Queue";
const EnqueueTypeId = "~effect/Queue/Enqueue";
const DequeueTypeId = "~effect/Queue/Dequeue";
const variance = {
  _A: identity,
  _E: identity
};
const QueueProto = {
  [TypeId$b]: variance,
  [EnqueueTypeId]: variance,
  [DequeueTypeId]: variance,
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "effect/Queue",
      state: this.state._tag,
      size: sizeUnsafe(this)
    };
  }
};
const make$7 = (options) => withFiber$1((fiber) => {
  const self = Object.create(QueueProto);
  self.scheduler = fiber.currentScheduler;
  self.capacity = options?.capacity ?? Number.POSITIVE_INFINITY;
  self.strategy = options?.strategy ?? "suspend";
  self.messages = make$8();
  self.scheduleRunning = false;
  self.state = {
    _tag: "Open",
    takers: /* @__PURE__ */ new Set(),
    offers: /* @__PURE__ */ new Set(),
    awaiters: /* @__PURE__ */ new Set()
  };
  return succeed$3(self);
});
const bounded = (capacity) => make$7({
  capacity
});
const offerAll = (self, messages) => suspend$1(() => {
  if (self.state._tag !== "Open") {
    return succeed$3(fromIterable(messages));
  }
  const remaining = offerAllUnsafe(self, messages);
  if (remaining.length === 0) {
    return exitSucceed([]);
  } else if (self.strategy === "dropping") {
    return succeed$3(remaining);
  }
  return offerRemainingArray(self, remaining);
});
const offerAllUnsafe = (self, messages) => {
  if (self.state._tag !== "Open") {
    return fromIterable(messages);
  } else if (self.capacity === Number.POSITIVE_INFINITY || self.strategy === "sliding") {
    appendAll(self.messages, messages);
    if (self.strategy === "sliding") {
      takeN(self.messages, self.messages.length - self.capacity);
    }
    scheduleReleaseTaker(self);
    return [];
  }
  const free = self.capacity <= 0 ? self.state.takers.size : self.capacity - self.messages.length;
  if (free === 0) {
    return fromIterable(messages);
  }
  const remaining = [];
  let i = 0;
  for (const message of messages) {
    if (i < free) {
      append(self.messages, message);
    } else {
      remaining.push(message);
    }
    i++;
  }
  scheduleReleaseTaker(self);
  return remaining;
};
const failCause = /* @__PURE__ */ dual(2, (self, cause) => sync$1(() => failCauseUnsafe(self, cause)));
const failCauseUnsafe = (self, cause) => {
  if (self.state._tag !== "Open") {
    return false;
  }
  const exit2 = exitFailCause(cause);
  const fail2 = exitZipRight(exit2, exitFailDone);
  if (self.state.offers.size === 0 && self.messages.length === 0) {
    finalize(self, fail2);
    return true;
  }
  self.state = {
    ...self.state,
    _tag: "Closing",
    exit: fail2
  };
  return true;
};
const end = (self) => failCause(self, causeFail(Done()));
const takeAll = (self) => takeBetween(self, 1, Number.POSITIVE_INFINITY);
const takeBetween = (self, min2, max) => suspend$1(() => takeBetweenUnsafe(self, min2, max) ?? andThen$1(awaitTake(self), takeBetween(self, 1, max)));
const sizeUnsafe = (self) => self.state._tag === "Done" ? 0 : self.messages.length;
const exitTrue = /* @__PURE__ */ exitSucceed(true);
const exitFailDone = /* @__PURE__ */ exitFail(/* @__PURE__ */ Done());
const releaseTakers = (self) => {
  self.scheduleRunning = false;
  if (self.state._tag === "Done" || self.state.takers.size === 0) {
    return;
  }
  for (const taker of self.state.takers) {
    self.state.takers.delete(taker);
    taker(exitVoid);
    if (self.messages.length === 0) {
      break;
    }
  }
};
const scheduleReleaseTaker = (self) => {
  if (self.scheduleRunning || self.state._tag === "Done" || self.state.takers.size === 0) {
    return;
  }
  self.scheduleRunning = true;
  self.scheduler.scheduleTask(() => releaseTakers(self), 0);
};
const takeBetweenUnsafe = (self, min2, max) => {
  if (self.state._tag === "Done") {
    return self.state.exit;
  } else if (max <= 0 || min2 <= 0) {
    return exitSucceed([]);
  } else if (self.capacity <= 0 && self.state.offers.size > 0) {
    self.capacity = 1;
    releaseCapacity(self);
    self.capacity = 0;
    const messages = [take(self.messages)];
    releaseCapacity(self);
    return exitSucceed(messages);
  }
  min2 = Math.min(min2, self.capacity || 1);
  if (min2 <= self.messages.length) {
    const messages = takeN(self.messages, max);
    releaseCapacity(self);
    return exitSucceed(messages);
  }
};
const offerRemainingArray = (self, remaining) => {
  return callback$1((resume) => {
    if (self.state._tag !== "Open") {
      return resume(exitSucceed(remaining));
    }
    const entry = {
      _tag: "Array",
      remaining,
      offset: 0,
      resume
    };
    self.state.offers.add(entry);
    return sync$1(() => {
      if (self.state._tag === "Open") {
        self.state.offers.delete(entry);
      }
    });
  });
};
const releaseCapacity = (self) => {
  if (self.state._tag === "Done") {
    return isDoneCause(self.state.exit.cause);
  } else if (self.state.offers.size === 0) {
    if (self.state._tag === "Closing" && self.messages.length === 0) {
      finalize(self, self.state.exit);
      return isDoneCause(self.state.exit.cause);
    }
    return false;
  }
  let n = self.capacity - self.messages.length;
  for (const entry of self.state.offers) {
    if (n === 0) break;
    else if (entry._tag === "Single") {
      append(self.messages, entry.message);
      n--;
      entry.resume(exitTrue);
      self.state.offers.delete(entry);
    } else {
      for (; entry.offset < entry.remaining.length; entry.offset++) {
        if (n === 0) return false;
        append(self.messages, entry.remaining[entry.offset]);
        n--;
      }
      entry.resume(exitSucceed([]));
      self.state.offers.delete(entry);
    }
  }
  return false;
};
const awaitTake = (self) => callback$1((resume) => {
  if (self.state._tag === "Done") {
    return resume(self.state.exit);
  }
  self.state.takers.add(resume);
  return sync$1(() => {
    if (self.state._tag !== "Done") {
      self.state.takers.delete(resume);
    }
  });
});
const finalize = (self, exit2) => {
  if (self.state._tag === "Done") {
    return;
  }
  const openState = self.state;
  self.state = {
    _tag: "Done",
    exit: exit2
  };
  for (const taker of openState.takers) {
    taker(exit2);
  }
  openState.takers.clear();
  for (const awaiter of openState.awaiters) {
    awaiter(exit2);
  }
  openState.awaiters.clear();
};
const makeUnsafe$2 = makeSemaphoreUnsafe;
const TypeId$a = "~effect/Channel";
const ChannelProto = {
  [TypeId$a]: {
    _Env: identity,
    _InErr: identity,
    _InElem: identity,
    _OutErr: identity,
    _OutElem: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const fromTransform = (transform2) => {
  const self = Object.create(ChannelProto);
  self.transform = (upstream, scope2) => catchCause(transform2(upstream, scope2), (cause) => succeed(failCause$1(cause)));
  return self;
};
const fromPull = (effect2) => fromTransform((_, __) => effect2);
const toTransform = (channel) => channel.transform;
const fromQueueArray = (queue) => fromPull(succeed(takeAll(queue)));
const unwrap$1 = (channel) => fromTransform((upstream, scope2) => {
  let pull;
  return succeed(suspend(() => {
    if (pull) return pull;
    return channel.pipe(provide$3(scope2), flatMap((channel2) => toTransform(channel2)(upstream, scope2)), flatMap((pull_) => pull = pull_));
  }));
});
const runWith = (self, f, onHalt) => suspend(() => {
  const scope2 = makeUnsafe$4();
  const makePull = toTransform(self)(done$1(), scope2);
  return catchDone(flatMap(makePull, f), succeed).pipe(onExit((exit2) => close(scope2, exit2)));
});
const provideServices$1 = /* @__PURE__ */ dual(2, (self, services2) => fromTransform((upstream, scope2) => map(provideServices$2(toTransform(self)(upstream, scope2), services2), provideServices$2(services2))));
const runForEach$1 = /* @__PURE__ */ dual(2, (self, f) => runWith(self, (pull) => forever(flatMap(pull, f), {
  disableYield: true
})));
const lambda = (f) => f;
const recurDefaults = /* @__PURE__ */ memoize((ast) => {
  switch (ast._tag) {
    case "Declaration": {
      const getLink = ast.annotations?.[ClassTypeId];
      if (isFunction(getLink)) {
        const link2 = getLink(ast.typeParameters);
        const to = recurDefaults(link2.to);
        return replaceEncoding(ast, to === link2.to ? [link2] : [new Link(to, link2.transformation)]);
      }
      return ast;
    }
    case "Objects":
    case "Arrays":
      return ast.recur((ast2) => {
        const defaultValue = ast2.context?.defaultValue;
        if (defaultValue) {
          return replaceEncoding(recurDefaults(ast2), defaultValue);
        }
        return recurDefaults(ast2);
      });
    case "Suspend":
      return ast.recur(recurDefaults);
    default:
      return ast;
  }
});
function makeEffect(schema2) {
  const ast = recurDefaults(toType(schema2.ast));
  const parser = run(ast);
  return (input, options) => {
    return parser(input, options?.parseOptions);
  };
}
function makeOption(schema2) {
  const parser = makeEffect(schema2);
  return (input, options) => {
    return getSuccess(runSyncExit(parser(input, options)));
  };
}
function makeUnsafe$1(schema2) {
  const parser = makeEffect(schema2);
  return (input, options) => {
    return runSync(mapErrorEager(parser(input, options), (issue) => new Error(issue.toString(), {
      cause: issue
    })));
  };
}
function decodeUnknownEffect$1(schema2) {
  return run(schema2.ast);
}
function decodeUnknownSync(schema2) {
  return asSync(decodeUnknownEffect$1(schema2));
}
const decodeSync$1 = decodeUnknownSync;
function encodeUnknownEffect$1(schema2) {
  return run(flip(schema2.ast));
}
function run(ast) {
  const parser = recur(ast);
  return (input, options) => flatMapEager(parser(some(input), options ?? defaultParseOptions), (oa) => {
    if (oa._tag === "None") {
      return fail(new InvalidValue(oa));
    }
    return succeed(oa.value);
  });
}
function asSync(parser) {
  return (input, options) => runSync(mapErrorEager(parser(input, options), (issue) => new Error(issue.toString(), {
    cause: issue
  })));
}
const recur = /* @__PURE__ */ memoize((ast) => {
  let parser;
  if (!ast.context && !ast.encoding && !ast.checks) {
    return (ou, options) => {
      parser ??= ast.getParser(recur);
      return parser(ou, resolve(ast)?.["parseOptions"] ?? options);
    };
  }
  const isStructural = isArrays(ast) || isObjects(ast) || isDeclaration(ast) && ast.typeParameters.length > 0;
  return (ou, options) => {
    options = resolve(ast)?.["parseOptions"] ?? options;
    const encoding = ast.encoding;
    let srou;
    if (encoding) {
      const links = encoding;
      const len = links.length;
      for (let i = len - 1; i >= 0; i--) {
        const link2 = links[i];
        const to = link2.to;
        const parser2 = recur(to);
        srou = srou ? flatMapEager(srou, (ou2) => parser2(ou2, options)) : parser2(ou, options);
        if (link2.transformation._tag === "Transformation") {
          const getter = link2.transformation.decode;
          srou = flatMapEager(srou, (ou2) => getter.run(ou2, options));
        } else {
          srou = link2.transformation.decode(srou, options);
        }
      }
      srou = mapErrorEager(srou, (issue) => new Encoding(ast, ou, issue));
    }
    parser ??= ast.getParser(recur);
    let sroa = srou ? flatMapEager(srou, (ou2) => parser(ou2, options)) : parser(ou, options);
    if (ast.checks) {
      const checks = ast.checks;
      if (options?.errors === "all" && isStructural && isSome(ou)) {
        sroa = catchEager(sroa, (issue) => {
          const issues = [];
          collectIssues(checks.filter((check) => check.annotations?.[STRUCTURAL_ANNOTATION_KEY]), ou.value, issues, ast, options);
          const out = isArrayNonEmpty(issues) ? issue._tag === "Composite" && issue.ast === ast ? new Composite(ast, issue.actual, [...issue.issues, ...issues]) : new Composite(ast, ou, [issue, ...issues]) : issue;
          return fail(out);
        });
      }
      sroa = flatMapEager(sroa, (oa) => {
        if (isSome(oa)) {
          const value = oa.value;
          const issues = [];
          collectIssues(checks, value, issues, ast, options);
          if (isArrayNonEmpty(issues)) {
            return fail(new Composite(ast, oa, issues));
          }
        }
        return succeed(oa);
      });
    }
    return sroa;
  };
});
const TypeId$9 = "~effect/Schema/Schema";
const SchemaProto = {
  [TypeId$9]: TypeId$9,
  pipe() {
    return pipeArguments(this, arguments);
  },
  annotate(annotations) {
    return this.rebuild(annotate(this.ast, annotations));
  },
  annotateKey(annotations) {
    return this.rebuild(annotateKey(this.ast, annotations));
  },
  check(...checks) {
    return this.rebuild(appendChecks(this.ast, checks));
  }
};
function make$6(ast, options) {
  const self = Object.create(SchemaProto);
  if (options) {
    Object.assign(self, options);
  }
  self.ast = ast;
  self.rebuild = (ast2) => make$6(ast2, options);
  self.makeUnsafe = makeUnsafe$1(self);
  self.makeOption = makeOption(self);
  return self;
}
const toCodecJson$1 = /* @__PURE__ */ toCodec((ast) => {
  const out = toCodecJsonBase(ast);
  if (out !== ast && isOptional(ast)) {
    return optionalKeyLastLink(out);
  }
  return out;
});
function toCodecJsonBase(ast) {
  switch (ast._tag) {
    case "Declaration": {
      const getLink = ast.annotations?.toCodecJson ?? ast.annotations?.toCodec;
      if (isFunction(getLink)) {
        const tps = isDeclaration(ast) ? ast.typeParameters.map((tp) => make$6(toEncoded(tp))) : [];
        const link2 = getLink(tps);
        const to = toCodecJson$1(link2.to);
        return replaceEncoding(ast, to === link2.to ? [link2] : [new Link(to, link2.transformation)]);
      }
      return replaceEncoding(ast, [unknownToNull]);
    }
    case "Unknown":
    case "ObjectKeyword":
      return replaceEncoding(ast, [unknownToJson]);
    case "Undefined":
    case "Void":
    case "Literal":
    case "Number":
      return ast.toCodecJson();
    case "UniqueSymbol":
    case "Symbol":
    case "BigInt":
      return ast.toCodecStringTree();
    case "Objects": {
      if (ast.propertySignatures.some((ps) => typeof ps.name !== "string")) {
        throw new globalThis.Error("Objects property names must be strings", {
          cause: ast
        });
      }
      return ast.recur(toCodecJson$1);
    }
    case "Union": {
      const sortedTypes = jsonReorder(ast.types);
      if (sortedTypes !== ast.types) {
        return new Union$1(sortedTypes, ast.mode, ast.annotations, ast.checks, ast.encoding, ast.context).recur(toCodecJson$1);
      }
      return ast.recur(toCodecJson$1);
    }
    case "Arrays":
    case "Suspend":
      return ast.recur(toCodecJson$1);
  }
  return ast;
}
const jsonReorder = /* @__PURE__ */ makeReorder(getJsonPriority);
function getJsonPriority(ast) {
  switch (ast._tag) {
    case "BigInt":
    case "Symbol":
    case "UniqueSymbol":
      return 0;
    default:
      return 1;
  }
}
function makeReorder(getPriority) {
  return (types) => {
    const indexMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < types.length; i++) {
      indexMap.set(toEncoded(types[i]), i);
    }
    const sortedTypes = [...types].sort((a, b) => {
      a = toEncoded(a);
      b = toEncoded(b);
      const pa = getPriority(a);
      const pb = getPriority(b);
      if (pa !== pb) return pa - pb;
      return indexMap.get(a) - indexMap.get(b);
    });
    const orderChanged = sortedTypes.some((ast, index) => ast !== types[index]);
    if (!orderChanged) return types;
    return sortedTypes;
  };
}
const TypeId$8 = TypeId$9;
function declareConstructor() {
  return (typeParameters, run2, annotations) => {
    return make$5(new Declaration(typeParameters.map(getAST), (typeParameters2) => run2(typeParameters2.map((ast) => make$5(ast))), annotations));
  };
}
function declare(is, annotations) {
  return declareConstructor()([], () => (input, ast) => is(input) ? succeed(input) : fail(new InvalidType(ast, some(input))), annotations);
}
const SchemaErrorTypeId = "~effect/Schema/SchemaError";
class SchemaError {
  [SchemaErrorTypeId] = SchemaErrorTypeId;
  _tag = "SchemaError";
  name = "SchemaError";
  issue;
  constructor(issue) {
    this.issue = issue;
  }
  get message() {
    return this.issue.toString();
  }
  toString() {
    return `SchemaError(${this.message})`;
  }
}
function decodeUnknownEffect(schema2) {
  const parser = decodeUnknownEffect$1(schema2);
  return (input, options) => {
    return mapErrorEager(parser(input, options), (issue) => new SchemaError(issue));
  };
}
const decodeSync = decodeSync$1;
function encodeUnknownEffect(schema2) {
  const parser = encodeUnknownEffect$1(schema2);
  return (input, options) => {
    return mapErrorEager(parser(input, options), (issue) => new SchemaError(issue));
  };
}
const encodeEffect = encodeUnknownEffect;
const make$5 = make$6;
function isSchema(u) {
  return hasProperty(u, TypeId$8) && u[TypeId$8] === TypeId$8;
}
const optionalKey = /* @__PURE__ */ lambda((schema2) => make$5(optionalKey$1(schema2.ast), {
  schema: schema2
}));
const optional = /* @__PURE__ */ lambda((self) => optionalKey(UndefinedOr(self)));
function Literal2(literal) {
  const out = make$5(new Literal$1(literal), {
    literal,
    transform(to) {
      return out.pipe(decodeTo(Literal2(to), {
        decode: transform$1(() => to),
        encode: transform$1(() => literal)
      }));
    }
  });
  return out;
}
const Never2 = /* @__PURE__ */ make$5(never);
const Any2 = /* @__PURE__ */ make$5(any);
const Unknown2 = /* @__PURE__ */ make$5(unknown);
const Null2 = /* @__PURE__ */ make$5(null_);
const Undefined2 = /* @__PURE__ */ make$5(undefined_);
const String$1 = /* @__PURE__ */ make$5(string);
const Number$1 = /* @__PURE__ */ make$5(number);
const Boolean$1 = /* @__PURE__ */ make$5(boolean);
const Void2 = /* @__PURE__ */ make$5(void_);
function makeStruct(ast, fields) {
  return make$5(ast, {
    fields,
    mapFields(f, options) {
      const fields2 = f(this.fields);
      return makeStruct(struct(fields2, options?.unsafePreserveChecks ? this.ast.checks : void 0), fields2);
    }
  });
}
function Struct(fields) {
  return makeStruct(struct(fields, void 0), fields);
}
const Array$1 = /* @__PURE__ */ lambda((schema2) => make$5(new Arrays(false, [], [schema2.ast]), {
  schema: schema2
}));
const NonEmptyArray = /* @__PURE__ */ lambda((schema2) => make$5(new Arrays(false, [schema2.ast], [schema2.ast]), {
  schema: schema2
}));
function makeUnion(ast, members) {
  return make$5(ast, {
    members,
    mapMembers(f, options) {
      const members2 = f(this.members);
      return makeUnion(union(members2, this.ast.mode, options?.unsafePreserveChecks ? this.ast.checks : void 0), members2);
    }
  });
}
function Union2(members, options) {
  return makeUnion(union(members, "anyOf", void 0), members);
}
function Literals(literals) {
  const members = literals.map(Literal2);
  return make$5(union(members, "anyOf", void 0), {
    literals,
    members,
    mapMembers(f) {
      return Union2(f(this.members));
    },
    pick(literals2) {
      return Literals(literals2);
    },
    transform(to) {
      return Union2(members.map((member, index) => member.transform(to[index])));
    }
  });
}
const NullOr = /* @__PURE__ */ lambda((self) => Union2([self, Null2]));
const UndefinedOr = /* @__PURE__ */ lambda((self) => Union2([self, Undefined2]));
function decodeTo(to, transformation) {
  return (from) => {
    return make$5(decodeTo$1(from.ast, to.ast, transformation ? make$9(transformation) : passthrough()), {
      from,
      to
    });
  };
}
function withConstructorDefault(defaultValue) {
  return (schema2) => {
    return make$5(withConstructorDefault$1(schema2.ast, defaultValue), {
      schema: schema2
    });
  };
}
function tag(literal) {
  return Literal2(literal).pipe(withConstructorDefault(() => some(literal)));
}
function instanceOf(constructor, annotations) {
  return declare((u) => u instanceof constructor, annotations);
}
function link() {
  return (encodeTo, transformation) => {
    return new Link(encodeTo.ast, make$9(transformation));
  };
}
const makeFilter = makeFilter$1;
function isFinite(annotations) {
  return makeFilter((n) => globalThis.Number.isFinite(n), {
    expected: "a finite number",
    meta: {
      _tag: "isFinite"
    },
    toArbitraryConstraint: {
      number: {
        noDefaultInfinity: true,
        noNaN: true
      }
    },
    ...annotations
  });
}
function CauseReason(error, defect) {
  const schema2 = declareConstructor()([error, defect], ([error2, defect2]) => (input, ast, options) => {
    if (!isReason(input)) {
      return fail(new InvalidType(ast, some(input)));
    }
    switch (input._tag) {
      case "Fail":
        return mapBothEager(decodeUnknownEffect$1(error2)(input.error, options), {
          onSuccess: makeFailReason,
          onFailure: (issue) => new Composite(ast, some(input), [new Pointer(["error"], issue)])
        });
      case "Die":
        return mapBothEager(decodeUnknownEffect$1(defect2)(input.defect, options), {
          onSuccess: makeDieReason,
          onFailure: (issue) => new Composite(ast, some(input), [new Pointer(["defect"], issue)])
        });
      case "Interrupt":
        return succeed(input);
    }
  }, {
    typeConstructor: {
      _tag: "effect/Cause/Failure"
    },
    generation: {
      runtime: `Schema.CauseReason(?, ?)`,
      Type: `Cause.Failure<?, ?>`,
      importDeclaration: `import * as Cause from "effect/Cause"`
    },
    expected: "Cause.Failure",
    toCodec: ([error2, defect2]) => link()(Union2([Struct({
      _tag: Literal2("Fail"),
      error: error2
    }), Struct({
      _tag: Literal2("Die"),
      defect: defect2
    }), Struct({
      _tag: Literal2("Interrupt"),
      fiberId: UndefinedOr(Finite)
    })]), transform({
      decode: (e) => {
        switch (e._tag) {
          case "Fail":
            return makeFailReason(e.error);
          case "Die":
            return makeDieReason(e.defect);
          case "Interrupt":
            return makeInterruptReason(e.fiberId);
        }
      },
      encode: identity
    })),
    toArbitrary: ([error2, defect2]) => causeReasonToArbitrary(error2, defect2),
    toEquivalence: ([error2, defect2]) => causeReasonToEquivalence(error2, defect2),
    toFormatter: ([error2, defect2]) => causeReasonToFormatter(error2, defect2)
  });
  return make$5(schema2.ast, {
    error,
    defect
  });
}
function causeReasonToArbitrary(error, defect) {
  return (fc, ctx) => {
    return fc.oneof(ctx?.isSuspend ? {
      maxDepth: 2,
      depthIdentifier: "Cause.Failure"
    } : {}, fc.constant(makeInterruptReason()), fc.integer({
      min: 1
    }).map(makeInterruptReason), error.map((e) => makeFailReason(e)), defect.map((d) => makeDieReason(d)));
  };
}
function causeReasonToEquivalence(error, defect) {
  return (a, b) => {
    if (a._tag !== b._tag) return false;
    switch (a._tag) {
      case "Fail":
        return error(a.error, b.error);
      case "Die":
        return defect(a.defect, b.defect);
      case "Interrupt":
        return a.fiberId === b.fiberId;
    }
  };
}
function causeReasonToFormatter(error, defect) {
  return (t) => {
    switch (t._tag) {
      case "Fail":
        return `Fail(${error(t.error)})`;
      case "Die":
        return `Die(${defect(t.defect)})`;
      case "Interrupt":
        return "Interrupt";
    }
  };
}
function Cause(error, defect) {
  const schema2 = declareConstructor()([error, defect], ([error2, defect2]) => {
    const failures = Array$1(CauseReason(error2, defect2));
    return (input, ast, options) => {
      if (!isCause(input)) {
        return fail(new InvalidType(ast, some(input)));
      }
      return mapBothEager(decodeUnknownEffect$1(failures)(input.reasons, options), {
        onSuccess: fromReasons,
        onFailure: (issue) => new Composite(ast, some(input), [new Pointer(["failures"], issue)])
      });
    };
  }, {
    typeConstructor: {
      _tag: "effect/Cause"
    },
    generation: {
      runtime: `Schema.Cause(?, ?)`,
      Type: `Cause.Cause<?, ?>`,
      importDeclaration: `import * as Cause from "effect/Cause"`
    },
    expected: "Cause",
    toCodec: ([error2, defect2]) => link()(Array$1(CauseReason(error2, defect2)), transform({
      decode: fromReasons,
      encode: ({
        reasons: failures
      }) => failures
    })),
    toArbitrary: ([error2, defect2]) => causeToArbitrary(error2, defect2),
    toEquivalence: ([error2, defect2]) => causeToEquivalence(error2, defect2),
    toFormatter: ([error2, defect2]) => causeToFormatter(error2, defect2)
  });
  return make$5(schema2.ast, {
    error,
    defect
  });
}
function causeToArbitrary(error, defect) {
  return (fc, ctx) => {
    return fc.array(causeReasonToArbitrary(error, defect)(fc, ctx)).map(fromReasons);
  };
}
function causeToEquivalence(error, defect) {
  const failures = Array$3(causeReasonToEquivalence(error, defect));
  return (a, b) => failures(a.reasons, b.reasons);
}
function causeToFormatter(error, defect) {
  const causeReason = causeReasonToFormatter(error, defect);
  return (t) => `Cause([${t.reasons.map(causeReason).join(", ")}])`;
}
const ErrorJsonEncoded = /* @__PURE__ */ Struct({
  message: String$1,
  name: /* @__PURE__ */ optionalKey(String$1),
  stack: /* @__PURE__ */ optionalKey(String$1)
});
const Error$1 = /* @__PURE__ */ instanceOf(globalThis.Error, {
  typeConstructor: {
    _tag: "Error"
  },
  generation: {
    runtime: `Schema.Error`,
    Type: `globalThis.Error`
  },
  expected: "Error",
  toCodecJson: () => link()(ErrorJsonEncoded, errorFromErrorJsonEncoded()),
  toArbitrary: () => (fc) => fc.string().map((message) => new globalThis.Error(message))
});
const defectTransformation = /* @__PURE__ */ new Transformation(/* @__PURE__ */ passthrough$1(), /* @__PURE__ */ transform$1((u) => {
  try {
    return JSON.parse(JSON.stringify(u));
  } catch {
    return format(u);
  }
}));
const Defect = /* @__PURE__ */ Union2([/* @__PURE__ */ ErrorJsonEncoded.pipe(/* @__PURE__ */ decodeTo(Error$1, /* @__PURE__ */ errorFromErrorJsonEncoded())), /* @__PURE__ */ Any2.pipe(/* @__PURE__ */ decodeTo(/* @__PURE__ */ Unknown2.annotate({
  toCodecJson: () => link()(Any2, defectTransformation),
  toArbitrary: () => (fc) => fc.json()
}), defectTransformation))]);
function Exit(value, error, defect) {
  const schema2 = declareConstructor()([value, error, defect], ([value2, error2, defect2]) => {
    const cause = Cause(error2, defect2);
    return (input, ast, options) => {
      if (!isExit(input)) {
        return fail(new InvalidType(ast, some(input)));
      }
      switch (input._tag) {
        case "Success":
          return mapBothEager(decodeUnknownEffect$1(value2)(input.value, options), {
            onSuccess: succeed$2,
            onFailure: (issue) => new Composite(ast, some(input), [new Pointer(["value"], issue)])
          });
        case "Failure":
          return mapBothEager(decodeUnknownEffect$1(cause)(input.cause, options), {
            onSuccess: failCause$2,
            onFailure: (issue) => new Composite(ast, some(input), [new Pointer(["cause"], issue)])
          });
      }
    };
  }, {
    typeConstructor: {
      _tag: "effect/Exit"
    },
    generation: {
      runtime: `Schema.Exit(?, ?, ?)`,
      Type: `Exit.Exit<?, ?, ?>`,
      importDeclaration: `import * as Exit from "effect/Exit"`
    },
    expected: "Exit",
    toCodec: ([value2, error2, defect2]) => link()(Union2([Struct({
      _tag: Literal2("Success"),
      value: value2
    }), Struct({
      _tag: Literal2("Failure"),
      cause: Cause(error2, defect2)
    })]), transform({
      decode: (e) => e._tag === "Success" ? succeed$2(e.value) : failCause$2(e.cause),
      encode: (exit2) => isSuccess(exit2) ? {
        _tag: "Success",
        value: exit2.value
      } : {
        _tag: "Failure",
        cause: exit2.cause
      }
    })),
    toArbitrary: ([value2, error2, defect2]) => (fc, ctx) => fc.oneof(ctx?.isSuspend ? {
      maxDepth: 2,
      depthIdentifier: "Exit"
    } : {}, value2.map((v) => succeed$2(v)), causeToArbitrary(error2, defect2)(fc, ctx).map((cause) => failCause$2(cause))),
    toEquivalence: ([value2, error2, defect2]) => {
      const cause = causeToEquivalence(error2, defect2);
      return (a, b) => {
        if (a._tag !== b._tag) return false;
        switch (a._tag) {
          case "Success":
            return value2(a.value, b.value);
          case "Failure":
            return cause(a.cause, b.cause);
        }
      };
    },
    toFormatter: ([value2, error2, defect2]) => {
      const cause = causeToFormatter(error2, defect2);
      return (t) => {
        switch (t._tag) {
          case "Success":
            return `Exit.Success(${value2(t.value)})`;
          case "Failure":
            return `Exit.Failure(${cause(t.cause)})`;
        }
      };
    }
  });
  return make$5(schema2.ast, {
    value,
    error,
    defect
  });
}
const Finite = /* @__PURE__ */ Number$1.check(/* @__PURE__ */ isFinite());
const immerable = /* @__PURE__ */ globalThis.Symbol.for("immer-draftable");
function makeClass(Inherited, identifier2, struct$1, annotations) {
  const getClassSchema = getClassSchemaFactory(struct$1, identifier2, annotations);
  const ClassTypeId2 = getClassTypeId(identifier2);
  return class extends Inherited {
    constructor(...[input, options]) {
      const props = input ?? {};
      if (options?.disableValidation) {
        super(props, options);
      } else {
        const validated = struct$1.makeUnsafe(props, options);
        super({
          ...props,
          ...validated
        }, {
          ...options,
          disableValidation: true
        });
      }
    }
    toString() {
      return `${identifier2}(${format({
        ...this
      })})`;
    }
    static [TypeId$8] = TypeId$8;
    get [ClassTypeId2]() {
      return ClassTypeId2;
    }
    static [immerable] = true;
    static identifier = identifier2;
    static fields = struct$1.fields;
    static get ast() {
      return getClassSchema(this).ast;
    }
    static pipe() {
      return pipeArguments(this, arguments);
    }
    static rebuild(ast) {
      return getClassSchema(this).rebuild(ast);
    }
    static makeUnsafe(input, options) {
      return new this(input, options);
    }
    static makeOption(input, options) {
      return makeOption(getClassSchema(this))(input, options);
    }
    static annotate(annotations2) {
      return this.rebuild(annotate(this.ast, annotations2));
    }
    static annotateKey(annotations2) {
      return this.rebuild(annotateKey(this.ast, annotations2));
    }
    static check(...checks) {
      return this.rebuild(appendChecks(this.ast, checks));
    }
    static extend(identifier3) {
      return (newFields, annotations2) => {
        const fields = {
          ...struct$1.fields,
          ...newFields
        };
        return makeClass(this, identifier3, makeStruct(struct(fields, struct$1.ast.checks, {
          identifier: identifier3
        }), fields), annotations2);
      };
    }
    static mapFields(f, options) {
      return struct$1.mapFields(f, options);
    }
  };
}
function getClassTransformation(self) {
  return new Transformation(transform$1((input) => new self(input)), passthrough$1());
}
function getClassTypeId(identifier2) {
  return `~effect/Schema/Class/${identifier2}`;
}
function getClassSchemaFactory(from, identifier2, annotations) {
  let memo;
  return (self) => {
    if (memo === void 0) {
      const transformation = getClassTransformation(self);
      const to = make$5(new Declaration([from.ast], () => (input, ast) => {
        return input instanceof self || hasProperty(input, getClassTypeId(identifier2)) ? succeed(input) : fail(new InvalidType(ast, some(input)));
      }, {
        identifier: identifier2,
        [ClassTypeId]: ([from2]) => new Link(from2, transformation),
        toCodec: ([from2]) => new Link(from2.ast, transformation),
        toArbitrary: ([from2]) => () => from2.map((args2) => new self(args2)),
        toFormatter: ([from2]) => (t) => `${self.identifier}(${from2(t)})`,
        "~sentinels": collectSentinels(from.ast),
        ...annotations
      }));
      memo = from.pipe(decodeTo(to, transformation));
    }
    return memo;
  };
}
function isStruct(schema2) {
  return isSchema(schema2);
}
const Class2 = (identifier2) => (schema2, annotations) => {
  const struct2 = isStruct(schema2) ? schema2 : Struct(schema2);
  return makeClass(Class$1, identifier2, struct2, annotations);
};
const ErrorClass = (identifier2) => (schema2, annotations) => {
  const struct2 = isStruct(schema2) ? schema2 : Struct(schema2);
  return makeClass(Error$2, identifier2, struct2, annotations);
};
function toCodecJson(schema2) {
  return make$5(toCodecJson$1(schema2.ast));
}
const TypeId$7 = "~effect/Stream";
const streamVariance = {
  _R: identity,
  _E: identity,
  _A: identity
};
const StreamProto = {
  [TypeId$7]: streamVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const fromChannel$1 = (channel) => {
  const self = Object.create(StreamProto);
  self.channel = channel;
  return self;
};
const TypeId$6 = "~effect/Stream";
const isStream = (u) => hasProperty(u, TypeId$6);
const fromChannel = fromChannel$1;
const toChannel = (stream) => stream.channel;
const fromQueue = (queue) => fromChannel(fromQueueArray(queue));
const unwrap = (effect2) => fromChannel(unwrap$1(map(effect2, toChannel)));
const provideServices = /* @__PURE__ */ dual(2, (self, services2) => fromChannel(provideServices$1(self.channel, services2)));
const runForEach = /* @__PURE__ */ dual(2, (self, f) => runForEach$1(self.channel, (arr) => {
  let i = 0;
  return whileLoop({
    while: () => i < arr.length,
    body: () => f(arr[i++]),
    step: constVoid
  });
}));
const TypeId$5 = "~effect/FiberSet";
const isFiberSet = (u) => hasProperty(u, TypeId$5);
const Proto$2 = {
  [TypeId$5]: TypeId$5,
  [Symbol.iterator]() {
    if (this.state._tag === "Closed") {
      return empty$2();
    }
    return this.state.backing[Symbol.iterator]();
  },
  ...PipeInspectableProto,
  toJSON() {
    return {
      _id: "FiberMap",
      state: this.state
    };
  }
};
const makeUnsafe = (backing, deferred) => {
  const self = Object.create(Proto$2);
  self.state = {
    _tag: "Open",
    backing
  };
  self.deferred = deferred;
  return self;
};
const make$4 = () => acquireRelease(sync(() => makeUnsafe(/* @__PURE__ */ new Set(), makeUnsafe$5())), (set2) => suspend(() => {
  const state = set2.state;
  if (state._tag === "Closed") return void_$1;
  set2.state = {
    _tag: "Closed"
  };
  const fibers = state.backing;
  return interruptAll(fibers).pipe(into(set2.deferred));
}));
const internalFiberId = -1;
const isInternalInterruption = /* @__PURE__ */ toPredicate(/* @__PURE__ */ compose(filterInterruptors, /* @__PURE__ */ has(internalFiberId)));
const addUnsafe = /* @__PURE__ */ dual((args2) => isFiberSet(args2[0]), (self, fiber, options) => {
  if (self.state._tag === "Closed") {
    fiber.interruptUnsafe(internalFiberId);
    return;
  } else if (self.state.backing.has(fiber)) {
    return;
  }
  self.state.backing.add(fiber);
  fiber.addObserver((exit2) => {
    if (self.state._tag === "Closed") {
      return;
    }
    self.state.backing.delete(fiber);
    if (isFailure(exit2) && (options?.propagateInterruption === true ? !isInternalInterruption(exit2.cause) : !hasInterruptsOnly(exit2.cause))) {
      doneUnsafe(self.deferred, exit2);
    }
  });
});
const constInterruptedFiber = /* @__PURE__ */ (function() {
  let fiber = void 0;
  return () => {
    if (fiber === void 0) {
      fiber = runFork(interrupt$1);
    }
    return fiber;
  };
})();
const runtime = (self) => () => map(services(), (services2) => {
  const runFork2 = runForkWith(services2);
  return (effect2, options) => {
    if (self.state._tag === "Closed") {
      return constInterruptedFiber();
    }
    const fiber = runFork2(effect2, options);
    addUnsafe(self, fiber);
    return fiber;
  };
});
const join = (self) => _await(self.deferred);
const symbol = "~effect/interfaces/PrimaryKey";
const StreamSchemaTypeId = "~effect/rpc/RpcSchema/StreamSchema";
function isStreamSchema(schema2) {
  return hasProperty(schema2, StreamSchemaTypeId);
}
function getStreamSchemas(schema2) {
  return isStreamSchema(schema2) ? {
    success: schema2.success,
    error: schema2.error
  } : void 0;
}
const schema = /* @__PURE__ */ declare(isStream);
function Stream(success, error) {
  return make$5(schema.ast, {
    [StreamSchemaTypeId]: StreamSchemaTypeId,
    success,
    error
  });
}
const TypeId$4 = "~effect/rpc/Rpc";
const Proto$1 = {
  [TypeId$4]: TypeId$4,
  pipe() {
    return pipeArguments(this, arguments);
  },
  setSuccess(successSchema) {
    return makeProto$1({
      _tag: this._tag,
      payloadSchema: this.payloadSchema,
      successSchema,
      errorSchema: this.errorSchema,
      defectSchema: this.defectSchema,
      annotations: this.annotations,
      middlewares: this.middlewares
    });
  },
  setError(errorSchema) {
    return makeProto$1({
      _tag: this._tag,
      payloadSchema: this.payloadSchema,
      successSchema: this.successSchema,
      errorSchema,
      defectSchema: this.defectSchema,
      annotations: this.annotations,
      middlewares: this.middlewares
    });
  },
  setPayload(payloadSchema) {
    return makeProto$1({
      _tag: this._tag,
      payloadSchema: isSchema(payloadSchema) ? payloadSchema : Struct(payloadSchema),
      successSchema: this.successSchema,
      errorSchema: this.errorSchema,
      defectSchema: this.defectSchema,
      annotations: this.annotations,
      middlewares: this.middlewares
    });
  },
  middleware(middleware) {
    return makeProto$1({
      _tag: this._tag,
      payloadSchema: this.payloadSchema,
      successSchema: this.successSchema,
      errorSchema: this.errorSchema,
      defectSchema: this.defectSchema,
      annotations: this.annotations,
      middlewares: /* @__PURE__ */ new Set([...this.middlewares, middleware])
    });
  },
  prefix(prefix) {
    return makeProto$1({
      _tag: `${prefix}${this._tag}`,
      payloadSchema: this.payloadSchema,
      successSchema: this.successSchema,
      errorSchema: this.errorSchema,
      defectSchema: this.defectSchema,
      annotations: this.annotations,
      middlewares: this.middlewares
    });
  },
  annotate(tag2, value) {
    return makeProto$1({
      _tag: this._tag,
      payloadSchema: this.payloadSchema,
      successSchema: this.successSchema,
      errorSchema: this.errorSchema,
      defectSchema: this.defectSchema,
      middlewares: this.middlewares,
      annotations: add(this.annotations, tag2, value)
    });
  },
  annotateMerge(context) {
    return makeProto$1({
      _tag: this._tag,
      payloadSchema: this.payloadSchema,
      successSchema: this.successSchema,
      errorSchema: this.errorSchema,
      defectSchema: this.defectSchema,
      middlewares: this.middlewares,
      annotations: merge$1(this.annotations, context)
    });
  }
};
const makeProto$1 = (options) => {
  function Rpc() {
  }
  Object.setPrototypeOf(Rpc, Proto$1);
  Object.assign(Rpc, options);
  Rpc.key = `effect/rpc/Rpc/${options._tag}`;
  return Rpc;
};
const make$3 = (tag2, options) => {
  const successSchema = options?.success ?? Void2;
  const errorSchema = options?.error ?? Never2;
  const defectSchema = options?.defect ?? Defect;
  let payloadSchema;
  if (options?.primaryKey) {
    payloadSchema = class Payload extends Class2(`effect/rpc/Rpc/${tag2}`)(options.payload) {
      [symbol]() {
        return options.primaryKey(this);
      }
    };
  } else {
    payloadSchema = isSchema(options?.payload) ? options?.payload : options?.payload ? Struct(options?.payload) : Void2;
  }
  return makeProto$1({
    _tag: tag2,
    payloadSchema,
    successSchema: options?.stream ? Stream(successSchema, errorSchema) : successSchema,
    errorSchema: options?.stream ? Never2 : errorSchema,
    defectSchema,
    annotations: empty$1(),
    middlewares: /* @__PURE__ */ new Set()
  });
};
const exitSchemaCache = /* @__PURE__ */ new WeakMap();
const exitSchema = (self) => {
  if (exitSchemaCache.has(self)) {
    return exitSchemaCache.get(self);
  }
  const rpc = self;
  const failures = /* @__PURE__ */ new Set([rpc.errorSchema]);
  const streamSchemas = getStreamSchemas(rpc.successSchema);
  if (streamSchemas) {
    failures.add(streamSchemas.error);
  }
  for (const middleware of rpc.middlewares) {
    failures.add(middleware.error);
  }
  const schema2 = Exit(streamSchemas ? Void2 : rpc.successSchema, Union2([...failures]), rpc.defectSchema);
  exitSchemaCache.set(self, schema2);
  return schema2;
};
const WrapperTypeId = "~effect/rpc/Rpc/Wrapper";
const isWrapper = (u) => WrapperTypeId in u;
const TypeId$3 = /* @__PURE__ */ Symbol.for("~effect/http/Headers");
const Proto = /* @__PURE__ */ Object.create(null);
Object.defineProperties(Proto, {
  [TypeId$3]: {
    value: TypeId$3
  },
  [symbolRedactable]: {
    value(context) {
      return redact(this, get(context, CurrentRedactedNames));
    }
  },
  toJSON: {
    value() {
      return redact$1(this);
    }
  },
  [symbol$1]: {
    value(that) {
      return Equivalence(this, that);
    }
  },
  [symbol$2]: {
    value() {
      return structure(this);
    }
  },
  toString: {
    value: BaseProto.toString
  },
  [NodeInspectSymbol]: {
    value: BaseProto[NodeInspectSymbol]
  }
});
const make$2 = (input) => Object.assign(Object.create(Proto), input);
const Equivalence = /* @__PURE__ */ makeEquivalence(/* @__PURE__ */ strictEqual());
const empty = /* @__PURE__ */ Object.create(Proto);
const fromInput = (input) => {
  if (input === void 0) {
    return empty;
  } else if (Symbol.iterator in input) {
    const out2 = Object.create(Proto);
    for (const [k, v] of input) {
      out2[k.toLowerCase()] = v;
    }
    return out2;
  }
  const out = Object.create(Proto);
  for (const [k, v] of Object.entries(input)) {
    if (Array.isArray(v)) {
      out[k.toLowerCase()] = v.join(", ");
    } else if (v !== void 0) {
      out[k.toLowerCase()] = v;
    }
  }
  return out;
};
const merge = /* @__PURE__ */ dual(2, (self, headers) => {
  const out = make$2(self);
  Object.assign(out, headers);
  return out;
});
const redact = /* @__PURE__ */ dual(2, (self, key) => {
  const out = {
    ...self
  };
  const modify = (key2) => {
    if (typeof key2 === "string") {
      const k = key2.toLowerCase();
      if (k in self) {
        out[k] = make$b(self[k]);
      }
    } else {
      for (const name in self) {
        if (key2.test(name)) {
          out[name] = make$b(self[name]);
        }
      }
    }
  };
  if (Array.isArray(key)) {
    for (let i = 0; i < key.length; i++) {
      modify(key[i]);
    }
  } else {
    modify(key);
  }
  return out;
});
const CurrentRedactedNames = /* @__PURE__ */ Reference("effect/Headers/CurrentRedactedNames", {
  defaultValue: () => ["authorization", "cookie", "set-cookie", "x-api-key"]
});
const TypeId$2 = "~effect/http/HttpClientError";
class HttpClientErrorSchema extends (/* @__PURE__ */ ErrorClass(TypeId$2)({
  _tag: /* @__PURE__ */ tag("HttpError"),
  kind: /* @__PURE__ */ Literals(["EncodeError", "DecodeError", "TransportError", "InvalidUrlError", "StatusCodeError", "EmptyBodyError"]),
  cause: /* @__PURE__ */ optional(Defect)
})) {
  /**
   * @since 4.0.0
   */
  static fromHttpClientError(error) {
    return new HttpClientErrorSchema({
      _tag: "HttpError",
      kind: error.reason._tag,
      cause: error.reason
    });
  }
}
const TypeId$1 = "~effect/socket/Socket";
const Socket = /* @__PURE__ */ Service("effect/socket/Socket");
const CloseEventTypeId = "~effect/socket/Socket/CloseEvent";
const isCloseEvent = (u) => hasProperty(u, CloseEventTypeId);
const SocketErrorTypeId = "~effect/socket/Socket/SocketError";
const isSocketError = (u) => hasProperty(u, SocketErrorTypeId);
class SocketReadError extends (/* @__PURE__ */ ErrorClass("effect/socket/Socket/SocketReadError")({
  _tag: /* @__PURE__ */ tag("SocketReadError"),
  cause: Defect
})) {
  /**
   * @since 4.0.0
   */
  message = `An error occurred during Read`;
}
class SocketWriteError extends (/* @__PURE__ */ ErrorClass("effect/socket/Socket/SocketWriteError")({
  _tag: /* @__PURE__ */ tag("SocketWriteError"),
  cause: Defect
})) {
  /**
   * @since 4.0.0
   */
  message = `An error occurred during Write`;
}
class SocketOpenError extends (/* @__PURE__ */ ErrorClass("effect/socket/Socket/SocketOpenError")({
  _tag: /* @__PURE__ */ tag("SocketOpenError"),
  kind: /* @__PURE__ */ Literals(["Unknown", "Timeout"]),
  cause: Defect
})) {
  /**
   * @since 4.0.0
   */
  get message() {
    return this.kind === "Timeout" ? `timeout waiting for "open"` : `An error occurred during Open`;
  }
}
class SocketCloseError extends (/* @__PURE__ */ ErrorClass("effect/socket/Socket/SocketCloseError")({
  _tag: /* @__PURE__ */ tag("SocketCloseError"),
  code: Number$1,
  closeReason: /* @__PURE__ */ optional(String$1)
})) {
  /**
   * @since 4.0.0
   */
  static filterClean(isClean) {
    return function(u) {
      return SocketError.is(u) && u.reason._tag === "SocketCloseError" && isClean(u.reason.code) ? succeed$4(u.reason) : fail$3(u);
    };
  }
  get message() {
    if (this.closeReason) {
      return `${this.code}: ${this.closeReason}`;
    }
    return `${this.code}`;
  }
}
const SocketErrorReason = /* @__PURE__ */ Union2([SocketReadError, SocketWriteError, SocketOpenError, SocketCloseError]);
class SocketError extends (/* @__PURE__ */ ErrorClass(SocketErrorTypeId)({
  _tag: /* @__PURE__ */ tag("SocketError"),
  reason: SocketErrorReason
})) {
  // @effect-diagnostics-next-line overriddenSchemaConstructor:off
  constructor(props) {
    if ("cause" in props.reason) {
      super({
        ...props,
        cause: props.reason.cause
      });
    } else {
      super(props);
    }
  }
  /**
   * @since 4.0.0
   */
  [SocketErrorTypeId] = SocketErrorTypeId;
  /**
   * @since 4.0.0
   */
  static is(u) {
    return isSocketError(u);
  }
}
const defaultCloseCodeIsError = (code) => code !== 1e3 && code !== 1006;
class WebSocket extends (/* @__PURE__ */ Service()("~effect/socket/Socket/WebSocket")) {
}
class WebSocketConstructor extends (/* @__PURE__ */ Service()("@effect/platform/Socket/WebSocketConstructor")) {
}
const layerWebSocketConstructorGlobal = /* @__PURE__ */ succeed$1(WebSocketConstructor)((url, protocols) => new globalThis.WebSocket(url, protocols));
const makeWebSocket = (url, options) => fromWebSocket(acquireRelease((typeof url === "string" ? succeed(url) : url).pipe(flatMap((url2) => map(WebSocketConstructor.asEffect(), (f) => f(url2, options?.protocols)))), (ws) => sync(() => ws.close(1e3))), options);
const fromWebSocket = (acquire, options) => withFiber((fiber) => {
  let currentWS;
  const latch = makeUnsafe$3(false);
  const acquireContext = fiber.services;
  const closeCodeIsError = options?.closeCodeIsError ?? defaultCloseCodeIsError;
  const runRaw = (handler, opts) => scopedWith(fnUntraced(function* (scope2) {
    const fiberSet = yield* make$4().pipe(provide$3(scope2));
    const ws = yield* provide$3(acquire, scope2);
    const run3 = yield* provideService(runtime(fiberSet)(), WebSocket, ws);
    let open = false;
    function onMessage(event) {
      if (event.data instanceof Blob) {
        const effect2 = flatMap(promise(() => event.data.arrayBuffer()), (buffer) => {
          const result3 = handler(new Uint8Array(buffer));
          return isEffect(result3) ? result3 : void_$1;
        });
        return run3(effect2);
      }
      const result2 = handler(event.data);
      if (isEffect(result2)) {
        run3(result2);
      }
    }
    function onError2(cause) {
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("close", onClose);
      doneUnsafe(fiberSet.deferred, fail(new SocketError({
        reason: open ? new SocketReadError({
          cause
        }) : new SocketOpenError({
          kind: "Unknown",
          cause
        })
      })));
    }
    function onClose(event) {
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("error", onError2);
      doneUnsafe(fiberSet.deferred, fail(new SocketError({
        reason: new SocketCloseError({
          code: event.code,
          closeReason: event.reason
        })
      })));
    }
    ws.addEventListener("close", onClose, {
      once: true
    });
    ws.addEventListener("error", onError2, {
      once: true
    });
    ws.addEventListener("message", onMessage);
    if (ws.readyState !== 1) {
      const openDeferred = makeUnsafe$5();
      ws.addEventListener("open", () => {
        open = true;
        doneUnsafe(openDeferred, void_$1);
      }, {
        once: true
      });
      yield* _await(openDeferred).pipe(timeoutOrElse({
        duration: options?.openTimeout ?? 1e4,
        onTimeout: () => fail(new SocketError({
          reason: new SocketOpenError({
            kind: "Timeout",
            cause: new Error('timeout waiting for "open"')
          })
        }))
      }), raceFirst(join(fiberSet)));
    }
    open = true;
    currentWS = ws;
    latch.openUnsafe();
    if (opts?.onOpen) yield* opts.onOpen;
    return yield* catchFilter(join(fiberSet), SocketCloseError.filterClean((_) => !closeCodeIsError(_)), () => void_$1);
  })).pipe(updateServices((input) => merge$1(acquireContext, input)), ensuring(sync(() => {
    latch.closeUnsafe();
    currentWS = void 0;
  })));
  const encoder = new TextEncoder();
  const run2 = (handler, opts) => runRaw((data) => typeof data === "string" ? handler(encoder.encode(data)) : data instanceof Uint8Array ? handler(data) : handler(new Uint8Array(data)), opts);
  const write = (chunk) => latch.whenOpen(sync(() => {
    const ws = currentWS;
    if (isCloseEvent(chunk)) {
      ws.close(chunk.code, chunk.reason);
    } else {
      ws.send(chunk);
    }
  }));
  const writer = succeed(write);
  return succeed(Socket.of({
    [TypeId$1]: TypeId$1,
    run: run2,
    runRaw,
    writer
  }));
});
class Collector extends (/* @__PURE__ */ Service()("effect/workers/Transferable/Collector")) {
}
const makeCollectorUnsafe = () => {
  let tranferables = [];
  const unsafeAddAll = (transfers) => {
    tranferables.push(...transfers);
  };
  const unsafeRead = () => tranferables;
  const unsafeClear = () => {
    const prev = tranferables;
    tranferables = [];
    return prev;
  };
  return Collector.of({
    addAllUnsafe: unsafeAddAll,
    addAll: (transferables) => sync(() => unsafeAddAll(transferables)),
    readUnsafe: unsafeRead,
    read: sync(unsafeRead),
    clearUnsafe: unsafeClear,
    clear: sync(unsafeClear)
  });
};
class WorkerSpawnError extends (/* @__PURE__ */ ErrorClass("effect/workers/WorkerError/WorkerSpawnError")({
  _tag: /* @__PURE__ */ tag("WorkerSpawnError"),
  message: String$1,
  cause: /* @__PURE__ */ optional(Defect)
})) {
}
class WorkerSendError extends (/* @__PURE__ */ ErrorClass("effect/workers/WorkerError/WorkerSendError")({
  _tag: /* @__PURE__ */ tag("WorkerSendError"),
  message: String$1,
  cause: /* @__PURE__ */ optional(Defect)
})) {
}
class WorkerReceiveError extends (/* @__PURE__ */ ErrorClass("effect/workers/WorkerError/WorkerReceiveError")({
  _tag: /* @__PURE__ */ tag("WorkerReceiveError"),
  message: String$1,
  cause: /* @__PURE__ */ optional(Defect)
})) {
}
class WorkerUnknownError extends (/* @__PURE__ */ ErrorClass("effect/workers/WorkerError/WorkerUnknownError")({
  _tag: /* @__PURE__ */ tag("WorkerUnknownError"),
  message: String$1,
  cause: /* @__PURE__ */ optional(Defect)
})) {
}
const WorkerErrorReason = /* @__PURE__ */ Union2([WorkerSpawnError, WorkerSendError, WorkerReceiveError, WorkerUnknownError]);
const TypeId = "~effect/rpc/RpcClientError";
class RpcClientDefect extends (/* @__PURE__ */ ErrorClass("effect/rpc/RpcClientError/RpcClientDefect")({
  _tag: /* @__PURE__ */ tag("RpcClientDefect"),
  message: String$1,
  cause: Defect
})) {
}
class RpcClientError extends (/* @__PURE__ */ ErrorClass(TypeId)({
  _tag: /* @__PURE__ */ tag("RpcClientError"),
  reason: /* @__PURE__ */ Union2([WorkerErrorReason, SocketErrorReason, HttpClientErrorSchema, RpcClientDefect])
})) {
  /**
   * @since 4.0.0
   */
  [TypeId] = TypeId;
  get message() {
    return `${this.reason._tag}: ${this.reason.message}`;
  }
}
const RequestId = (id) => typeof id === "bigint" ? id : BigInt(id);
const constPing = {
  _tag: "Ping"
};
class RpcSerialization extends (/* @__PURE__ */ Service()("effect/rpc/RpcSerialization")) {
}
const json = /* @__PURE__ */ RpcSerialization.of({
  contentType: "application/json",
  includesFraming: false,
  makeUnsafe: () => {
    const decoder = new TextDecoder();
    return {
      decode: (bytes) => [JSON.parse(typeof bytes === "string" ? bytes : decoder.decode(bytes))],
      encode: (response) => JSON.stringify(response)
    };
  }
});
const layerJson = /* @__PURE__ */ succeed$1(RpcSerialization)(json);
const withRun = () => (f) => suspend(() => {
  const semaphore = makeUnsafe$2(1);
  let buffer = [];
  let write = (...args2) => servicesWith((context) => {
    buffer.push([args2, context]);
    return void_$1;
  });
  return map(f((...args2) => write(...args2)), (a) => ({
    ...a,
    run(f2) {
      return semaphore.withPermits(1)(gen(function* () {
        const prev = write;
        write = f2;
        for (const [args2, context] of buffer) {
          yield* provide(write(...args2), context);
        }
        buffer = [];
        return yield* onExit(never$1, () => {
          write = prev;
          return void_$1;
        });
      }));
    }
  }));
});
let requestIdCounter = /* @__PURE__ */ BigInt(0);
const makeNoSerialization = /* @__PURE__ */ fnUntraced(function* (group, options) {
  const spanPrefix = options?.spanPrefix ?? "RpcClient";
  const supportsAck = options?.supportsAck ?? true;
  const disableTracing = options?.disableTracing ?? false;
  const generateRequestId = options?.generateRequestId ?? (() => requestIdCounter++);
  const services$12 = yield* services();
  const scope2 = get(services$12, Scope);
  const entries = /* @__PURE__ */ new Map();
  let isShutdown = false;
  yield* addFinalizer(scope2, withFiber((parent) => {
    isShutdown = true;
    return clearEntries(interrupt$2(parent.id));
  }));
  const clearEntries = fnUntraced(function* (exit2) {
    for (const [id, entry] of entries) {
      entries.delete(id);
      if (entry._tag === "Queue") {
        yield* exit2._tag === "Success" ? end(entry.queue) : failCause(entry.queue, exit2.cause);
      } else {
        entry.resume(exit2);
      }
    }
  });
  const onRequest = (rpc) => {
    const isStream2 = isStreamSchema(rpc.successSchema);
    const middleware = getRpcClientMiddleware(rpc);
    return (payload, opts) => {
      const headers = opts?.headers ? fromInput(opts.headers) : empty;
      const context = opts?.context ?? empty$1();
      if (!isStream2) {
        const onRequest2 = (span) => onEffectRequest(rpc, middleware, span, rpc.payloadSchema.makeUnsafe(payload), headers, context, opts?.discard ?? false);
        return disableTracing ? onRequest2(void 0) : useSpan(`${spanPrefix}.${rpc._tag}`, {
          attributes: options.spanAttributes
        }, onRequest2);
      }
      const queue = onStreamRequest(rpc, middleware, rpc.payloadSchema.makeUnsafe(payload), headers, opts?.streamBufferSize ?? 16, context);
      if (opts?.asQueue) return queue;
      return unwrap(map(queue, fromQueue));
    };
  };
  const onEffectRequest = (rpc, middleware, span, payload, headers, context, discard) => withFiber((parentFiber) => {
    if (isShutdown) {
      return interrupt$1;
    }
    const id = generateRequestId();
    const send = middleware((message) => options.onFromClient({
      message,
      context,
      discard
    }), {
      _tag: "Request",
      id,
      tag: rpc._tag,
      payload,
      ...span ? {
        traceId: span.traceId,
        spanId: span.spanId,
        sampled: span.sampled
      } : {},
      headers: merge(parentFiber.getRef(CurrentHeaders), headers)
    });
    if (discard) {
      return send;
    }
    let fiber;
    return onInterrupt(callback((resume) => {
      const entry = {
        _tag: "Effect",
        rpc,
        context,
        resume(exit2) {
          resume(exit2);
          if (fiber && !fiber.pollUnsafe()) {
            parentFiber.currentScheduler.scheduleTask(() => {
              fiber.interruptUnsafe(parentFiber.id);
            }, 0);
          }
        }
      };
      entries.set(id, entry);
      fiber = send.pipe(span ? withParentSpan(span, {
        captureStackTrace: false
      }) : identity, runForkWith(parentFiber.services));
      fiber.addObserver((exit2) => {
        if (exit2._tag === "Failure") {
          return resume(exit2);
        }
      });
    }), (interruptors2) => {
      entries.delete(id);
      return andThen(interrupt(fiber), sendInterrupt(id, Array.from(interruptors2), context));
    });
  });
  const onStreamRequest = fnUntraced(function* (rpc, middleware, payload, headers, streamBufferSize, context) {
    if (isShutdown) {
      return yield* interrupt$1;
    }
    const span = disableTracing ? void 0 : yield* makeSpanScoped(`${spanPrefix}.${rpc._tag}`, {
      attributes: options.spanAttributes
    });
    const fiber = getCurrent();
    const id = generateRequestId();
    const scope3 = getUnsafe(fiber.services, Scope);
    yield* addFinalizerExit(scope3, (exit2) => {
      if (!entries.has(id)) return void_$1;
      entries.delete(id);
      return sendInterrupt(id, isFailure(exit2) ? Array.from(interruptors(exit2.cause)) : [], context);
    });
    const queue = yield* bounded(streamBufferSize);
    entries.set(id, {
      _tag: "Queue",
      rpc,
      queue,
      scope: scope3,
      context
    });
    yield* middleware((message) => options.onFromClient({
      message,
      context,
      discard: false
    }), {
      _tag: "Request",
      id,
      tag: rpc._tag,
      payload,
      ...span ? {
        traceId: span.traceId,
        spanId: span.spanId,
        sampled: span.sampled
      } : {},
      headers: merge(fiber.getRef(CurrentHeaders), headers)
    }).pipe(span ? withParentSpan(span, {
      captureStackTrace: false
    }) : identity, catchCause((error) => failCause(queue, error)), interruptible, forkIn(scope3, {
      startImmediately: true
    }));
    return queue;
  });
  const getRpcClientMiddleware = (rpc) => {
    const middlewares = [];
    for (const tag2 of rpc.middlewares.values()) {
      const middleware = services$12.mapUnsafe.get(`${tag2.key}/Client`);
      if (!middleware) continue;
      middlewares.push(middleware);
    }
    if (middlewares.length === 0) {
      return (send, request) => send(request);
    }
    return function loop(send, request, index = middlewares.length - 1) {
      if (index === -1) {
        return send(request);
      }
      return middlewares[index]({
        rpc,
        request,
        next(request2) {
          return loop(send, request2, index - 1);
        }
      });
    };
  };
  const sendInterrupt = (requestId, interruptors2, context) => callback((resume) => {
    const parentFiber = getCurrent();
    const fiber = options.onFromClient({
      message: {
        _tag: "Interrupt",
        requestId,
        interruptors: interruptors2
      },
      context,
      discard: false
    }).pipe(timeout(1e3), runForkWith(parentFiber.services));
    fiber.addObserver(() => {
      resume(void_$1);
    });
  });
  const write = (message) => {
    switch (message._tag) {
      case "Chunk": {
        const requestId = message.requestId;
        const entry = entries.get(requestId);
        if (!entry || entry._tag !== "Queue") return void_$1;
        return offerAll(entry.queue, message.values).pipe(supportsAck ? flatMap(() => options.onFromClient({
          message: {
            _tag: "Ack",
            requestId: message.requestId
          },
          context: entry.context,
          discard: false
        })) : identity, catchCause((cause) => failCause(entry.queue, cause)));
      }
      case "Exit": {
        const requestId = message.requestId;
        const entry = entries.get(requestId);
        if (!entry) return void_$1;
        entries.delete(requestId);
        if (entry._tag === "Effect") {
          entry.resume(message.exit);
          return void_$1;
        }
        return message.exit._tag === "Success" ? end(entry.queue) : failCause(entry.queue, message.exit.cause);
      }
      case "Defect": {
        return clearEntries(die(message.defect));
      }
      case "ClientEnd": {
        return void_$1;
      }
    }
  };
  let client;
  if (options.flatten) {
    const fns = /* @__PURE__ */ new Map();
    client = function client2(tag2, payload, options2) {
      let fn = fns.get(tag2);
      if (!fn) {
        fn = onRequest(group.requests.get(tag2));
        fns.set(tag2, fn);
      }
      return fn(payload, options2);
    };
  } else {
    client = {};
    group.requests.forEach((rpc) => {
      client[rpc._tag] = onRequest(rpc);
    });
  }
  return {
    client,
    write
  };
});
const make$1 = /* @__PURE__ */ fnUntraced(function* (group, options) {
  const {
    run: run2,
    send,
    supportsAck,
    supportsTransferables
  } = yield* Protocol;
  const entries = /* @__PURE__ */ new Map();
  const {
    client,
    write
  } = yield* makeNoSerialization(group, {
    ...options,
    supportsAck,
    onFromClient({
      message
    }) {
      switch (message._tag) {
        case "Request": {
          const rpc = group.requests.get(message.tag);
          const collector = supportsTransferables ? makeCollectorUnsafe() : void 0;
          const fiber = getCurrent();
          const entry = {
            rpc,
            context: collector ? add(fiber.services, Collector, collector) : fiber.services,
            schemas: rpcSchemas(rpc)
          };
          entries.set(message.id, entry);
          return entry.schemas.encodePayload(message.payload).pipe(provideServices$2(entry.context), orDie, flatMap((payload) => send({
            ...message,
            id: String(message.id),
            payload,
            headers: Object.entries(message.headers)
          }, collector && collector.readUnsafe())));
        }
        case "Ack": {
          const entry = entries.get(message.requestId);
          if (!entry) return void_$1;
          return send({
            _tag: "Ack",
            requestId: String(message.requestId)
          });
        }
        case "Interrupt": {
          const entry = entries.get(message.requestId);
          if (!entry) return void_$1;
          entries.delete(message.requestId);
          return send({
            _tag: "Interrupt",
            requestId: String(message.requestId)
          });
        }
        case "Eof": {
          return void_$1;
        }
      }
    }
  });
  yield* run2((message) => {
    switch (message._tag) {
      case "Chunk": {
        const requestId = RequestId(message.requestId);
        const entry = entries.get(requestId);
        if (!entry || !entry.schemas.decodeChunk) return void_$1;
        return entry.schemas.decodeChunk(message.values).pipe(provideServices$2(entry.context), orDie, flatMap((chunk) => write({
          _tag: "Chunk",
          clientId: 0,
          requestId: RequestId(message.requestId),
          values: chunk
        })), onError((cause) => write({
          _tag: "Exit",
          clientId: 0,
          requestId: RequestId(message.requestId),
          exit: failCause$2(cause)
        })));
      }
      case "Exit": {
        const requestId = RequestId(message.requestId);
        const entry = entries.get(requestId);
        if (!entry) return void_$1;
        entries.delete(requestId);
        return entry.schemas.decodeExit(message.exit).pipe(provideServices$2(entry.context), orDie, matchCauseEffect({
          onSuccess: (exit2) => write({
            _tag: "Exit",
            clientId: 0,
            requestId,
            exit: exit2
          }),
          onFailure: (cause) => write({
            _tag: "Exit",
            clientId: 0,
            requestId,
            exit: failCause$2(cause)
          })
        }));
      }
      case "Defect": {
        return write({
          _tag: "Defect",
          clientId: 0,
          defect: decodeDefect(message.defect)
        });
      }
      case "ClientProtocolError": {
        const exit2 = fail$1(message.error);
        return forEach(entries.keys(), (requestId) => write({
          _tag: "Exit",
          clientId: 0,
          requestId,
          exit: exit2
        }));
      }
      default: {
        return void_$1;
      }
    }
  }).pipe(catchCause(logError), interruptible, forkScoped);
  return client;
});
const rpcSchemasCache = /* @__PURE__ */ new WeakMap();
const rpcSchemas = (rpc) => {
  let entry = rpcSchemasCache.get(rpc);
  if (entry !== void 0) {
    return entry;
  }
  const streamSchemas = getStreamSchemas(rpc.successSchema);
  entry = {
    decodeChunk: streamSchemas ? decodeUnknownEffect(toCodecJson(NonEmptyArray(streamSchemas.success))) : void 0,
    encodePayload: encodeEffect(toCodecJson(rpc.payloadSchema)),
    decodeExit: decodeUnknownEffect(toCodecJson(exitSchema(rpc)))
  };
  rpcSchemasCache.set(rpc, entry);
  return entry;
};
const CurrentHeaders = /* @__PURE__ */ Reference("effect/rpc/RpcClient/CurrentHeaders", {
  defaultValue: () => empty
});
class Protocol extends (/* @__PURE__ */ Service()("effect/rpc/RpcClient/Protocol")) {
  /**
   * @since 4.0.0
   */
  static make = /* @__PURE__ */ withRun();
}
const makeProtocolSocket = (options) => Protocol.make(fnUntraced(function* (writeResponse) {
  const socket = yield* Socket;
  const serialization = yield* RpcSerialization;
  const write = yield* socket.writer;
  let parser = serialization.makeUnsafe();
  const pinger = yield* makePinger(write(parser.encode(constPing)));
  let currentError;
  const clearCurrentError = sync(() => {
    currentError = void 0;
  });
  yield* suspend(() => {
    parser = serialization.makeUnsafe();
    pinger.reset();
    return socket.runRaw((message) => {
      try {
        const responses = parser.decode(message);
        if (responses.length === 0) return;
        let i = 0;
        return whileLoop({
          while: () => i < responses.length,
          body: () => {
            const response = responses[i++];
            if (response._tag === "Pong") {
              pinger.onPong();
            }
            return writeResponse(response);
          },
          step: constVoid
        });
      } catch (defect) {
        return writeResponse({
          _tag: "ClientProtocolError",
          error: new RpcClientError({
            reason: new RpcClientDefect({
              message: "Error decoding message",
              cause: defect
            })
          })
        });
      }
    }, {
      onOpen: clearCurrentError
    }).pipe(raceFirst(flatMap(pinger.timeout, () => fail(new SocketError({
      reason: new SocketOpenError({
        kind: "Timeout",
        cause: new Error("ping timeout")
      })
    })))));
  }).pipe(flatMap(() => fail(new SocketError({
    reason: new SocketCloseError({
      code: 1e3
    })
  }))), tapCause((cause) => {
    const error = findError(cause);
    const hasError = isSuccess$1(error);
    currentError = new RpcClientError({
      reason: hasError ? error.success.reason : new RpcClientDefect({
        message: "Unknown socket error",
        cause: squash(cause)
      })
    });
    return writeResponse({
      _tag: "ClientProtocolError",
      error: currentError
    });
  }), retry(defaultRetryPolicy), annotateLogs({
    module: "RpcClient",
    method: "makeProtocolSocket"
  }), forkScoped);
  return {
    send(request) {
      if (currentError) {
        return fail(currentError);
      }
      const encoded = parser.encode(request);
      if (encoded === void 0) return void_$1;
      return orDie(write(encoded));
    },
    supportsAck: true,
    supportsTransferables: false
  };
}));
const defaultRetryPolicy = /* @__PURE__ */ exponential(500, 1.5).pipe(/* @__PURE__ */ either(/* @__PURE__ */ spaced(5e3)));
const makePinger = /* @__PURE__ */ fnUntraced(function* (writePing) {
  let recievedPong = true;
  const latch = makeUnsafe$3();
  const reset = () => {
    recievedPong = true;
    latch.closeUnsafe();
  };
  const onPong = () => {
    recievedPong = true;
  };
  yield* suspend(() => {
    if (!recievedPong) return latch.open;
    recievedPong = false;
    return writePing;
  }).pipe(delay("5 seconds"), ignore, forever, interruptible, forkScoped);
  return {
    timeout: latch.await,
    reset,
    onPong
  };
});
const layerProtocolSocket = (options) => effect(Protocol)(makeProtocolSocket());
const decodeDefect = /* @__PURE__ */ decodeSync(Defect);
const RpcGroupProto = {
  add(...rpcs) {
    const requests = new Map(this.requests);
    for (const rpc of rpcs) {
      requests.set(rpc._tag, rpc);
    }
    return makeProto({
      requests,
      annotations: this.annotations
    });
  },
  merge(...groups) {
    const requests = new Map(this.requests);
    const annotations = new Map(this.annotations.mapUnsafe);
    for (const group of groups) {
      for (const [tag2, rpc] of group.requests) {
        requests.set(tag2, rpc);
      }
      for (const [key, value] of group.annotations.mapUnsafe) {
        annotations.set(key, value);
      }
    }
    return makeProto({
      requests,
      annotations: makeUnsafe$6(annotations)
    });
  },
  middleware(middleware) {
    const requests = /* @__PURE__ */ new Map();
    for (const [tag2, rpc] of this.requests) {
      requests.set(tag2, rpc.middleware(middleware));
    }
    return makeProto({
      requests,
      annotations: this.annotations
    });
  },
  toHandlers(build) {
    const self = this;
    return gen(function* () {
      const services$12 = yield* services();
      const handlers = isEffect(build) ? yield* build : build;
      const contextMap = /* @__PURE__ */ new Map();
      for (const [tag2, handler] of Object.entries(handlers)) {
        const rpc = self.requests.get(tag2);
        contextMap.set(rpc.key, {
          tag: rpc._tag,
          handler,
          services: services$12
        });
      }
      return makeUnsafe$6(contextMap);
    });
  },
  prefix(prefix) {
    const requests = /* @__PURE__ */ new Map();
    for (const rpc of this.requests.values()) {
      const newRpc = rpc.prefix(prefix);
      requests.set(newRpc._tag, newRpc);
    }
    return makeProto({
      requests,
      annotations: this.annotations
    });
  },
  toLayer(build) {
    return effectServices(this.toHandlers(build));
  },
  of: identity,
  toLayerHandler(service, build) {
    const self = this;
    return effectServices(gen(function* () {
      const services$12 = yield* services();
      const handler = isEffect(build) ? yield* build : build;
      const contextMap = /* @__PURE__ */ new Map();
      const rpc = self.requests.get(service);
      contextMap.set(rpc.key, {
        handler,
        services: services$12
      });
      return makeUnsafe$6(contextMap);
    }));
  },
  accessHandler(service) {
    return servicesWith((parentServices) => {
      const rpc = this.requests.get(service);
      const {
        handler,
        services: services2
      } = parentServices.mapUnsafe.get(rpc.key);
      return succeed((payload, options) => {
        options.rpc = rpc;
        const result2 = handler(payload, options);
        const effectOrStream = isWrapper(result2) ? result2.value : result2;
        return isEffect(effectOrStream) ? provide(effectOrStream, services2) : provideServices(effectOrStream, services2);
      });
    });
  },
  annotate(service, value) {
    return makeProto({
      requests: this.requests,
      annotations: add(this.annotations, service, value)
    });
  },
  annotateRpcs(service, value) {
    return this.annotateRpcsMerge(make$d(service, value));
  },
  annotateMerge(context) {
    return makeProto({
      requests: this.requests,
      annotations: merge$1(this.annotations, context)
    });
  },
  annotateRpcsMerge(serviceMap) {
    const requests = /* @__PURE__ */ new Map();
    for (const [tag2, rpc] of this.requests) {
      requests.set(tag2, rpc.annotateMerge(merge$1(serviceMap, rpc.annotations)));
    }
    return makeProto({
      requests,
      annotations: this.annotations
    });
  }
};
const makeProto = (options) => Object.assign(function() {
}, RpcGroupProto, {
  requests: options.requests,
  annotations: options.annotations
});
const make = (...rpcs) => makeProto({
  requests: new Map(rpcs.map((rpc) => [rpc._tag, rpc])),
  annotations: empty$1()
});
export {
  Array$1 as A,
  Boolean$1 as B,
  Literal2 as L,
  NullOr as N,
  Socket as S,
  Union2 as U,
  Struct as a,
  String$1 as b,
  Number$1 as c,
  make$3 as d,
  effect as e,
  make as f,
  layerProtocolSocket as g,
  provideMerge as h,
  layerJson as i,
  gen as j,
  make$1 as k,
  layerWebSocketConstructorGlobal as l,
  makeWebSocket as m,
  sync as n,
  provide as o,
  provide$2 as p,
  exit as q,
  runForEach as r,
  scoped as s,
  isFailure as t,
  sleep as u,
  runFork as v,
  runPromise as w,
  interrupt as x
};
