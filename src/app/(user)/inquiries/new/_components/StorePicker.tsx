'use client';
import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { searchStores } from '@/contracts/discovery/api';
import { DiscoveryStoreSearchDto, DiscoveryStoreSearchItemResultDto, DiscoveryStoreSearchResultDto } from '@/contracts/discovery/dto/discovery-store-search.dto';
import { handleApiError } from '@/shared/api/error';
import Button from '@/shared/components/ui/button/Button';
import Field from '@/shared/components/ui/form/Field';
import Input from '@/shared/components/ui/form/Input';
import { validateAction } from '@/shared/utils/validation';
import StoreMapModal from './StoreMapModal';
import styles from '@/app/css/user/StorePicker.module.css';

type StorePickerProps = {
    value: DiscoveryStoreSearchItemResultDto | null;                   // 고른 업체
    onPick: (store: DiscoveryStoreSearchItemResultDto | null) => void; // 고름 · 다시 고르기(null)
};

/** 검색어 최대 글자 수 — DiscoveryStoreSearchDto */
const KEYWORD_MAX = 50;

/** 사진 없음 — 홈 업체 카드와 같은 그림 */
const PHOTO_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>;

/**
 * 업체 고르기 — 이름 검색 → 결과(사진 · 상호명 · 주소 · 지도 · 고르기), 고른 뒤에는 그 업체 · 다시 고르기
 * - 검색은 버튼 · Enter(폼 제출)로만 부른다. 결과 줄의 버튼은 검색 폼 밖에 둔다(폼 안이면 다시 검색을 제출한다)
 *
 * @param param0
 * @returns
 */
export default function StorePicker({value, onPick}: StorePickerProps): React.ReactNode {
    // 상태
    const [keyword, setKeyword] = useState<string>('');                                             // 검색 칸
    const [results, setResults] = useState<Array<DiscoveryStoreSearchItemResultDto> | null>(null); // 검색 결과 — 검색 전 null
    const [searching, setSearching] = useState<boolean>(false);                                     // 검색 중
    const [mapStore, setMapStore] = useState<DiscoveryStoreSearchItemResultDto | null>(null);       // 지도 팝업의 업체

    // 함수
    async function search(event: FormEvent<HTMLFormElement>): Promise<void> {
        // ② 검색 — 검색어 검사(칸 옆) 뒤 부른다
        event.preventDefault();
        const dto = new DiscoveryStoreSearchDto({keyword: keyword.trim()});
        if (searching || !(await validateAction(dto))) {
            return;
        }

        setSearching(true);
        let found: DiscoveryStoreSearchResultDto | null = null; // 검색 결과
        let failure: {error: unknown} | null = null;            // 실패 — 처리는 try 밖에서
        try {
            found = await searchStores(dto);
        } catch (error) {
            failure = {error};
        }

        setSearching(false);
        if (failure) {
            handleApiError(failure.error);
            return;
        }

        setResults(found?.list ?? []);
    }

    function storeRow(store: DiscoveryStoreSearchItemResultDto, actions: React.ReactNode): React.ReactNode {
        // 업체 한 줄 — 사진(없으면 그림) · 상호명 · 주소 · 버튼
        return (
            <div className={styles.row}>
                <div className={styles.thumb}>{store.image_url ? <Image src={store.image_url} alt="" fill sizes="56px" unoptimized className={styles.thumbImg} /> : PHOTO_ICON}</div>
                <div className={styles.info}><strong className={styles.name}>{store.store_name}</strong><span className={styles.address}>{store.address}</span></div>
                <div className={styles.actions}>{actions}</div>
            </div>
        );
    }

    return (
        // 업체 고르기
        <div className={styles.picker}>
            {value ? (
                // 고른 업체 · 다시 고르기
                storeRow(value, <><Button size="sm" onClick={() => setMapStore(value)}>지도</Button><Button size="sm" onClick={() => onPick(null)}>다시 고르기</Button></>)
            ) : (
                <>
                    {/* ② 검색 — 버튼 · Enter */}
                    <form role="search" onSubmit={search}>
                        <Field label="업체 이름" name="keyword" htmlFor="inquiry-store-keyword">
                            <div className={styles.search}>
                                <Input id="inquiry-store-keyword" type="search" placeholder="상호명으로 검색" maxLength={KEYWORD_MAX} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
                                <Button type="submit" disabled={searching}>검색</Button>
                            </div>
                        </Field>
                    </form>

                    {/* ② 결과 · 없음 */}
                    {results && results.length === 0 ? <p className={styles.empty}>검색 결과가 없어요</p> : null}
                    {results && results.length > 0 ? (
                        <ul className={styles.results} aria-label="검색 결과">
                            {results.map((store) => <li key={store.store_id}>{storeRow(store, <><Button size="sm" onClick={() => setMapStore(store)}>지도</Button><Button size="sm" variant="primary" onClick={() => onPick(store)}>고르기</Button></>)}</li>)}
                        </ul>
                    ) : null}
                </>
            )}

            {/* ② 지도 팝업 */}
            <StoreMapModal store={mapStore} onClose={() => setMapStore(null)} />
        </div>
    );
}
