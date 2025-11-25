import AppHeader from "../AppHeader";

export default function AppHeaderExample() {
  return (
    <AppHeader
      userName="Mario Rossi"
      userRole="Dipendente"
      notificationCount={3}
      showSidebarTrigger={false}
    />
  );
}
