import { AppearanceSettings } from "./AppearanceSettings";
import { DomainSettings } from "./DomainSettings";
import { GeneralSettings } from "./GeneralSettings";
import { IntegrationSettings } from "./IntegrationSettings";
import { NotificationSettings } from "./NotificationSettings";
export function SettingsOverview() {
  return (
    <div className="space-y-6">
      <GeneralSettings />
      <AppearanceSettings />
      <DomainSettings />
      <NotificationSettings />
      <IntegrationSettings />
    </div>
  );
}
