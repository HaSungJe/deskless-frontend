'use client';
import { DiscoveryStoreSearchItemResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import StoreMap from '@/shared/components/map/StoreMap';
import Modal from '@/shared/components/ui/modal/Modal';
import { MapMarkerType } from '@/shared/types/map';
import styles from '@/app/css/user/StorePicker.module.css';

type StoreMapModalProps = {
    store: DiscoveryStoreSearchItemResultDto | null; // 지도로 볼 업체 — null 이면 닫힘
    onClose: () => void;                              // 닫기
};

/** 지도 확대 단계 — 업체 상세 위치 지도와 같다 */
const LOCATION_MAP_LEVEL = 4;

/**
 * 업체 위치 팝업 — 핀 하나 · 끌기 · 확대 끔(업체 상세 위치 지도와 같은 부품)
 *
 * @param param0
 * @returns
 */
export default function StoreMapModal({store, onClose}: StoreMapModalProps): React.ReactNode {
    // 계산 값
    const markers: Array<MapMarkerType> = store ? [{id: store.store_id, title: store.store_name, latitude: store.latitude, longitude: store.longitude}] : []; // 핀 하나

    return (
        // 지도 팝업
        <Modal open={store !== null} title={store?.store_name ?? '업체 위치'} onClose={onClose}>
            {store ? (
                <>
                    <p className={styles.address}>{store.address}</p>
                    <div className={styles.map}><StoreMap center={{latitude: store.latitude, longitude: store.longitude}} markers={markers} level={LOCATION_MAP_LEVEL} locked /></div>
                </>
            ) : null}
        </Modal>
    );
}
