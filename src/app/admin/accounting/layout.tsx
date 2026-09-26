import RecordSiteView from "@/app/components/RecordSiteView";

export default function AccountingAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RecordSiteView page="accounting_admin" />
      {children}
    </>
  );
}
