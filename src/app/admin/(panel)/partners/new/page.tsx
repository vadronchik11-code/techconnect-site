import AdminHeader from '@/components/admin/AdminHeader';
import PartnerForm from '@/components/admin/PartnerForm';
import { createPartner } from '@/lib/actions/partners';

export default function NewPartnerPage() {
  return (
    <>
      <AdminHeader title="Новый партнёр" back={{ href: '/admin/partners', label: 'К списку партнёров' }} />
      <PartnerForm action={createPartner} submitLabel="Создать" />
    </>
  );
}
