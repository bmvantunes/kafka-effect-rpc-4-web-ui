import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { DashboardView } from "../components/dashboard-view";
import { MonitorShell } from "../components/monitor-shell";
import {
  dashboardHealthyScenario,
  gmailDegradedScenario
} from "./live-scenarios";

const meta = {
  title: "Pulse/Dashboard",
  component: DashboardView,
  tags: ["autodocs", "test"],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/"
      }
    }
  },
  render: () => (
    <MonitorShell>
      <DashboardView />
    </MonitorShell>
  )
} satisfies Meta<typeof DashboardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const HealthyFleet: Story = {
  parameters: {
    pulse: {
      scenario: dashboardHealthyScenario
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByText(/Live Heartbeat Dashboard/i);
    const gmail = await canvas.findByText(/Gmail healthy/i);
    const usa = await canvas.findByText(/^USA$/i);

    await expect(title).toBeVisible();
    await expect(gmail).toBeVisible();
    await expect(usa).toBeVisible();
  }
};

export const GmailDegraded: Story = {
  parameters: {
    pulse: {
      scenario: gmailDegradedScenario
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gmail = await canvas.findByText(/Gmail stale/i);
    const description = await canvas.findByText(/one old process drags the minimum/i);

    await expect(gmail).toBeVisible();
    await expect(description).toBeVisible();
  }
};
