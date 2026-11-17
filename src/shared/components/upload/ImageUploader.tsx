'use client';
import Image from 'next/image';
import { ChangeEvent, useId, useState } from 'react';
import { closestCenter, DndContext, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Button, { buttonClass } from '@/shared/components/ui/button/Button';
import Badge from '@/shared/components/ui/display/Badge';
import styles from '@/shared/css/upload/ImageUploader.module.css';

/** 사진 한 장 — 화면이 응답(image_url · file_url)으로 만든다 */
export type UploaderImageType = {
    id: string;        // 사진 ID — 삭제 · 순서 API 에 보낸다
    image_url: string; // 보여 줄 주소
    alt: string;       // 대체 글 · 버튼 이름에 쓴다
};

type ImageUploaderProps = {
    images: Array<UploaderImageType>;         // 지금 사진(순서대로 — 첫 장이 대표)
    max?: number;                             // 최대 장수
    onUpload: (file: File) => Promise<void>;  // 고른 파일 — 화면이 uploadFile · 다시 조회
    onDelete: (id: string) => void;           // 삭제 — 확인 모달은 화면이
    onReorder?: (ids: Array<string>) => void; // 순서 바꿈(id 전부) — 없으면 끌기 없음
    disabled?: boolean;                       // 전부 막기(권한 없음 · 처리 중)
};

type SortableThumbProps = {
    image: UploaderImageType;       // 사진
    index: number;                  // 순서(0 이 대표)
    sortable: boolean;              // 손잡이를 보일지
    disabled: boolean;              // 삭제 막기
    onDelete: (id: string) => void; // 삭제
};

/**
 * 사진 목록 · 올리기 — 첫 장 "대표", 손잡이로 순서 끌기(마우스 · 키보드), 삭제, "사진 올리기"(JPG · PNG, max 장까지)
 *
 * @param param0
 * @returns
 */
export default function ImageUploader({images, max = 5, onUpload, onDelete, onReorder, disabled = false}: ImageUploaderProps): React.ReactNode {
    // 변수
    const dndId = useId(); // 끌기 안내 요소 id — 서버 · 브라우저 렌더가 같게
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    ); // 마우스(4px 넘게 움직이면 끌기) · 키보드(손잡이에서 스페이스 · 방향키)

    // 상태
    const [order, setOrder] = useState<Array<string>>(() => images.map((image) => image.id)); // 보이는 순서 — 놓자마자 바뀌게
    const [prevImages, setPrevImages] = useState<Array<UploaderImageType>>(images);           // 직전 images — 바뀌면 순서를 맞춘다
    const [uploading, setUploading] = useState<boolean>(false);                               // 올리는 중

    // images 가 바뀌면(다시 조회) 보이는 순서를 맞춘다 — 렌더 중에 맞춘다(effect 로 하면 한 번 더 그린다)
    if (images !== prevImages) {
        setPrevImages(images);
        setOrder(images.map((image) => image.id));
    }

    // 계산 값
    const sorted = order
        .map((id) => images.find((image) => image.id === id))
        .filter((image): image is UploaderImageType => Boolean(image));  // 보이는 순서의 사진
    const sortable = Boolean(onReorder) && !disabled && sorted.length > 1; // 끌기를 켤지
    const canUpload = sorted.length < max;                                 // 더 올릴 수 있는지

    // 함수
    async function chooseFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        // 고른 파일 한 장을 화면에 넘긴다 — 같은 파일을 다시 고를 수 있게 칸을 비운다
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) {
            return;
        }

        setUploading(true);
        let failure: {error: unknown} | null = null; // 화면이 던진 오류 — 막힘을 푼 뒤 그대로 다시 던진다(try … finally 는 React Compiler 가 건너뛴다)
        try {
            await onUpload(file);
        } catch (error) {
            failure = {error};
        }

        setUploading(false);
        if (failure) {
            throw failure.error;
        }
    }

    function endDrag(event: DragEndEvent): void {
        // 놓은 자리로 순서를 바꾸고 화면에 id 전부를 넘긴다
        const {active, over} = event;
        if (!over || active.id === over.id) {
            return;
        }

        const next = arrayMove(order, order.indexOf(String(active.id)), order.indexOf(String(over.id)));
        setOrder(next);
        onReorder?.(next);
    }

    return (
        // 사진 목록 · 올리기
        <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={endDrag}>
            <SortableContext items={order} strategy={rectSortingStrategy} disabled={!sortable}>
                <div className={styles.thumbs}>
                    {/* 사진 — 첫 장이 대표 */}
                    {sorted.map((image, index) => (
                        <SortableThumb key={image.id} image={image} index={index} sortable={sortable} disabled={disabled} onDelete={onDelete} />
                    ))}

                    {/* 올리기 칸 — max 장이면 숨김 */}
                    {canUpload ? (
                        <label className={styles.upload} aria-disabled={uploading || disabled}>
                            <input type="file" accept="image/jpeg,image/png" className={styles.file} onChange={chooseFile} disabled={uploading || disabled} />
                            <span>{uploading ? '올리는 중…' : '사진 올리기'}</span>
                            <small className={styles.uploadHint}>JPG · PNG, {max}장까지</small>
                        </label>
                    ) : null}
                </div>
            </SortableContext>
        </DndContext>
    );
}

/**
 * 사진 한 장 — 손잡이 · 순번(첫 장 "대표") · 삭제
 *
 * @param param0
 * @returns
 */
function SortableThumb({image, index, sortable, disabled, onDelete}: SortableThumbProps): React.ReactNode {
    // 변수
    const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging} = useSortable({id: image.id}); // 끌기 — 손잡이에만 붙인다
    const dragStyle = {transform: CSS.Transform.toString(transform), transition};                   // 끄는 동안 위치(@dnd-kit 이 계산 — 인라인만 가능)
    const classNames = [styles.thumb, isDragging ? styles.dragging : ''].filter(Boolean).join(' '); // 사진 · 끄는 중

    return (
        // 사진 한 장
        <figure ref={setNodeRef} style={dragStyle} className={classNames}>
            {/* 사진 — 원격(CDN · S3) 주소라 최적화 없이 */}
            <div className={styles.image}>
                <Image src={image.image_url} alt={image.alt} fill sizes="176px" unoptimized className={styles.img} />
            </div>

            {/* 손잡이 · 순번 · 삭제 */}
            <figcaption className={styles.caption}>
                {sortable ? (
                    <button type="button" ref={setActivatorNodeRef} className={buttonClass({size: 'sm', icon: true})} {...attributes} {...listeners} aria-label={`${image.alt} 순서 옮기기`}>
                        ⋮⋮
                    </button>
                ) : <span />}
                {index === 0 ? <Badge tone="primary">대표</Badge> : <span>{index + 1}</span>}
                <Button size="sm" icon variant="danger" aria-label={`${image.alt} 삭제`} onClick={() => onDelete(image.id)} disabled={disabled}>✕</Button>
            </figcaption>
        </figure>
    );
}
