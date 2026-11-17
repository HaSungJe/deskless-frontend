import { firstQueryValue } from '@/shared/utils/util';
import BookingContent from './BookingContent';

// U3 예약 — /stores/[store_id]/booking (고르기는 공개, 예약은 이용자)
export default async function Booking({params, searchParams}: PageProps<'/stores/[store_id]/booking'>): Promise<React.ReactNode> {
    const {store_id} = await params;
    const query = await searchParams;

    return (
        // 예약 화면
        <BookingContent storeId={store_id} roomGroupId={firstQueryValue(query.room_group_id)} />
    );
}
