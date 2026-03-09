import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { HostnamesView } from "../components/hostnames-view";
import { MonitorShell } from "../components/monitor-shell";
import { hostRecoveryScenario } from "./live-scenarios";

const meta = {
  title: "Pulse/Hostnames",
  component: HostnamesView,
  tags: ["autodocs", "test"],
  loaders: () => {
    console.log('-----------------------window', globalThis.window)
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/hostnames"
      }
    }
  },
  render: () => (
    <MonitorShell>
      <HostnamesView />
    </MonitorShell>
  )
} satisfies Meta<typeof HostnamesView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MixedRecovery: Story = {
  parameters: {
    pulse: {
      scenario: hostRecoveryScenario
    }
  },
  loaders: () => {
    console.log('-----------------------window', globalThis.window)
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const host = await canvas.findByText(/drive-asia-host-2/i);
    const stale = await canvas.findAllByText(/stale hostname/i);

    await expect(host).toBeVisible();
    await expect(stale.length).toBeGreaterThan(0);
  }
};
