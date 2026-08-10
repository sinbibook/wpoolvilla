/**
 * Room Page Data Mapper
 * room.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 객실 페이지 전용 기능 제공
 * URL 파라미터로 ?index=0,1,2...를 받아서 동적으로 객실 정보 표시
 */
class RoomMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentRoom = null;
        this.currentRoomIndex = null;
        this.currentRoomPageData = null;
    }

    // ============================================================================
    // 🏠 ROOM PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 객실 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentRoom() {
        if (!this.isDataLoaded || !this.data.rooms) {
            console.error('Data not loaded or no rooms data available');
            return null;
        }

        // URL에서 room id 추출
        const urlParams = new URLSearchParams(window.location.search);
        let roomId = urlParams.get('id');

        // id가 없으면 첫 번째 room으로 리다이렉트
        if (!roomId && this.data.rooms.length > 0) {
            console.warn('Room id not specified, redirecting to first room');
            window.location.href = this.buildUrl('room.html', { id: this.data.rooms[0].id });
            return null;
        }

        if (!roomId) {
            console.error('Room id not specified in URL and no rooms available');
            return null;
        }

        // rooms 배열에서 해당 id의 객실 찾기
        const roomIndex = this.data.rooms.findIndex(room => room.id === roomId);

        if (roomIndex === -1) {
            console.error(`Room with id ${roomId} not found`);
            return null;
        }

        const room = this.data.rooms[roomIndex];
        this.currentRoom = room;
        this.currentRoomIndex = roomIndex; // 인덱스도 저장 (페이지 데이터 접근용)
        return room;
    }

    /**
     * 현재 객실 페이지 데이터 가져오기 (캐시 포함)
     */
    getCurrentRoomPageData() {
        // 현재 room을 먼저 가져와서 캐시가 유효한지 확인
        const room = this.getCurrentRoom();
        if (!room || !room.id) {
            return null;
        }

        // 캐시된 데이터가 있고 같은 room이면 바로 반환
        if (this.currentRoomPageData && this.currentRoomPageData.id === room.id) {
            return this.currentRoomPageData;
        }

        const roomPages = this.safeGet(this.data, 'homepage.customFields.pages.room');
        if (!roomPages || !Array.isArray(roomPages)) {
            return null;
        }

        // pages.room 배열에서 현재 room.id와 일치하는 페이지 데이터 찾기
        const pageData = roomPages.find(page => page.id === room.id);
        if (!pageData) {
            return null;
        }

        // 캐시 저장
        this.currentRoomPageData = {
            id: room.id,
            data: pageData
        };

        return this.currentRoomPageData;
    }

    /**
     * Hero Slider 섹션 매핑 (페이지 상단)
     * customFields.roomtypes[].images (roomtype_interior) → [data-hero-slider] (customFields 우선)
     */
    mapHeroSlider() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const sliderContainer = this.safeSelect('[data-hero-slider]');
        if (!sliderContainer) return;

        // customFields 이미지 사용
        const selectedImages = this.getRoomImages(room, 'roomtype_interior');

        // 슬라이더 초기화
        sliderContainer.innerHTML = '';

        if (selectedImages.length === 0) {
            // 이미지가 없을 경우 placeholder 슬라이드 추가
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide active';

            const imgElement = document.createElement('img');
            ImageHelpers.applyPlaceholder(imgElement);

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);

            // Total 카운트 업데이트
            const totalSlidesEl = this.safeSelect('[data-total-slides]');
            if (totalSlidesEl) totalSlidesEl.textContent = '01';
            return;
        }

        // 이미지 생성
        selectedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide';
            if (index === 0) {
                slideDiv.classList.add('active');
            }

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.alt = this.sanitizeText(img.description, room.name);
            imgElement.loading = index === 0 ? 'eager' : 'lazy';

            // 첫 번째 이미지가 로드되면 슬라이더 초기화
            if (index === 0) {
                imgElement.onload = () => {
                    // DOM 렌더링 완료를 위한 최소 지연 (슬라이더 레이아웃 계산에 필요)
                    setTimeout(() => {
                        if (typeof window.initRoomHeroSlider === 'function') {
                            window.initRoomHeroSlider();
                        }
                    }, 100);
                };
            }

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
        });

        // 네비게이션 총 개수 업데이트
        const totalSlidesEl = this.safeSelect('[data-total-slides]');
        if (totalSlidesEl) {
            totalSlidesEl.textContent = String(selectedImages.length).padStart(2, '0');
        }
    }

    /**
     * Hero 슬라이더 재초기화
     */
    reinitializeHeroSlider() {
        // 이제 mapHeroSlider에서 직접 처리하므로 여기서는 호출하지 않음
        // if (typeof window.initRoomHeroSlider === 'function') {
        //     window.initRoomHeroSlider();
        // }
    }

    /**
     * 기본 정보 섹션 매핑 (객실명, 썸네일, 설명)
     * rooms[index].name → [data-room-name]
     * rooms[index].images[0].thumbnail → [data-room-thumbnail]
     * homepage.customFields.pages.room[index].sections[0].hero.title → [data-room-description]
     */
    mapBasicInfo() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 객실명 매핑 (customFields 우선)
        const roomName = this.safeSelect('[data-room-name]');
        if (roomName) {
            roomName.textContent = this.getRoomName(room);
        }

        // 썸네일 이미지 매핑 (customFields)
        const roomThumbnail = this.safeSelect('[data-room-thumbnail]');
        if (roomThumbnail) {
            const customThumbnails = this.getRoomImages(room, 'roomtype_thumbnail');
            if (customThumbnails.length > 0) {
                roomThumbnail.src = customThumbnails[0].url;
                roomThumbnail.alt = customThumbnails[0].description || this.getRoomName(room);
            } else {
                ImageHelpers.applyPlaceholder(roomThumbnail);
            }
        }

        // 객실 설명 매핑 (CUSTOM FIELD)
        const roomDescription = this.safeSelect('[data-room-description]');
        if (roomDescription) {
            const roomPageData = this.getCurrentRoomPageData();
            const heroTitle = roomPageData?.data?.sections?.[0]?.hero?.title;
            roomDescription.innerHTML = this._formatTextWithLineBreaks(heroTitle, '객실 설명');
        }
    }

    /**
     * Room Detail 슬라이더 매핑 (customFields 우선)
     * customFields.roomtypes[].images (roomtype_interior) (index 2~5) → [data-room-slider-wrapper], [data-room-thumbnails]
     */
    mapRoomDetailSlider() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const sliderWrapper = this.safeSelect('[data-room-slider-wrapper]');
        const indicatorsContainer = this.safeSelect('[data-room-slider-indicators]');
        const thumbnailsContainer = this.safeSelect('[data-room-thumbnails]');

        if (!sliderWrapper) return;

        // customFields 이미지 사용
        const selectedImages = this.getRoomImages(room, 'roomtype_interior');

        // 인덱스 2번부터 4개 이미지 (Room Detail용)
        const detailImages = selectedImages.slice(2, 6);

        // 슬라이더 이미지 생성
        sliderWrapper.innerHTML = '';
        if (detailImages.length === 0) {
            const img = document.createElement('img');
            img.className = 'room-slide active';
            ImageHelpers.applyPlaceholder(img);
            sliderWrapper.appendChild(img);
        } else {
            detailImages.forEach((image, index) => {
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = this.sanitizeText(image.description, room.name);
                img.className = `room-slide ${index === 0 ? 'active' : ''}`;
                img.loading = index === 0 ? 'eager' : 'lazy';
                sliderWrapper.appendChild(img);
            });
        }

        // 인디케이터 생성
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = '';
            const count = detailImages.length || 1;
            for (let i = 0; i < count; i++) {
                const indicator = document.createElement('span');
                indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
                indicator.setAttribute('data-slide', i);
                indicatorsContainer.appendChild(indicator);
            }
        }

        // 썸네일 이미지 생성
        if (thumbnailsContainer) {
            thumbnailsContainer.innerHTML = '';
            if (detailImages.length === 0) {
                const img = document.createElement('img');
                img.className = 'thumb-img active';
                img.setAttribute('data-slide', '0');
                ImageHelpers.applyPlaceholder(img);
                thumbnailsContainer.appendChild(img);
            } else {
                detailImages.forEach((image, index) => {
                    const img = document.createElement('img');
                    img.src = image.url;
                    img.alt = this.sanitizeText(image.description, room.name);
                    img.className = `thumb-img ${index === 0 ? 'active' : ''}`;
                    img.setAttribute('data-slide', index);
                    img.loading = 'lazy';
                    thumbnailsContainer.appendChild(img);
                });
            }
        }

        // Room Detail 슬라이더 재초기화 (DOM 렌더링 완료 후)
        // requestAnimationFrame을 두 번 사용하여 확실한 DOM 업데이트 보장
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (typeof window.initRoomDetailSlider === 'function') {
                    window.initRoomDetailSlider();
                }
            });
        });
    }

    /**
     * 객실 상세 정보 매핑
     */
    mapRoomDetails() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 객실 크기 (시스템 데이터)
        const roomSize = this.safeSelect('[data-room-size]');
        if (roomSize) {
            const size = room.size ? `${room.size}㎡` : '-';
            roomSize.textContent = size;
        }

        // 침대 타입 (시스템 데이터)
        const roomBedTypes = this.safeSelect('[data-room-bed-types]');
        if (roomBedTypes) {
            const bedTypes = room.bedTypes || [];
            roomBedTypes.textContent = bedTypes.length > 0 ? bedTypes.join(', ') : '-';
        }

        // 객실 구성 (시스템 데이터)
        const roomComposition = this.safeSelect('[data-room-composition]');
        if (roomComposition) {
            const roomStructures = room.roomStructures || [];
            roomComposition.textContent = roomStructures.length > 0 ? roomStructures.join(', ') : '-';
        }

        // 인원 (시스템 데이터)
        const roomCapacity = this.safeSelect('[data-room-capacity]');
        if (roomCapacity) {
            const capacity = `기준 ${room.baseOccupancy || 2}인 / 최대 ${room.maxOccupancy || 4}인`;
            roomCapacity.textContent = capacity;
        }

        // 체크인 (객실 단위 timeSettings 우선)
        const roomCheckin = this.safeSelect('[data-room-checkin]');
        if (roomCheckin) {
            roomCheckin.textContent = room.timeSettings?.checkin || '-';
        }

        // 체크아웃 (객실 단위 timeSettings 우선)
        const roomCheckout = this.safeSelect('[data-room-checkout]');
        if (roomCheckout) {
            roomCheckout.textContent = room.timeSettings?.checkout || '-';
        }

        // 객실 이용규칙/안내사항 (시스템 데이터) — 내용 없으면 Room Information 섹션(제목 포함) 미노출
        const roomGuide = this.safeSelect('[data-room-guide]');
        if (roomGuide) {
            const roomInfo = (room.roomInfo || '').trim();
            const guideSection = roomGuide.closest('[data-room-usage-guide]');
            if (roomInfo) {
                roomGuide.innerHTML = this._formatTextWithLineBreaks(roomInfo);
                if (guideSection) guideSection.style.display = '';
            } else {
                roomGuide.innerHTML = '';
                if (guideSection) guideSection.style.display = 'none';
            }
        }
    }

    /**
     * 객실 편의시설/특징 매핑
     * rooms[index].amenities → [data-room-amenities-grid]
     */
    mapRoomAmenities() {
        const room = this.getCurrentRoom();
        if (!room) return;

        const amenitiesGrid = this.safeSelect('[data-room-amenities-grid]');
        const amenitiesSection = this.safeSelect('[data-room-amenities]');

        if (!amenitiesGrid) return;

        // amenities가 없으면 섹션 숨김
        if (!room.amenities || room.amenities.length === 0) {
            if (amenitiesSection) amenitiesSection.style.display = 'none';
            return;
        }

        // DocumentFragment를 사용하여 성능 최적화
        const fragment = document.createDocumentFragment();

        // 어메니티 아이템들 생성
        room.amenities.forEach(amenity => {
            const amenityDiv = document.createElement('div');
            amenityDiv.className = 'amenity-item';

            const amenityName = amenity.name?.ko || amenity.name || amenity;

            amenityDiv.innerHTML = `
                <span class="amenity-icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0.5" y="0.5" width="15" height="15" rx="2" stroke="currentColor"/>
                        <path d="M4 8L6.5 10.5L12 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                <span class="amenity-name">${this.sanitizeText(amenityName, '편의시설')}</span>
            `;

            fragment.appendChild(amenityDiv);
        });

        // DOM에 한 번만 추가하여 리플로우 최소화
        amenitiesGrid.innerHTML = '';
        amenitiesGrid.appendChild(fragment);
    }

    /**
     * Marquee 섹션 매핑 (customFields 우선)
     * customFields.property.nameEn → [data-marquee-property-name] (uppercase, 5개 span 반복)
     */
    mapMarqueeSection() {
        const marqueeContainer = this.safeSelect('[data-marquee-property-name]');
        if (!marqueeContainer) return;

        // 기존 내용 제거
        marqueeContainer.innerHTML = '';

        // 5개의 span 생성 (customFields 우선)
        const nameEnUpper = this.getPropertyNameEn().toUpperCase();
        for (let i = 0; i < 5; i++) {
            const span = document.createElement('span');
            span.textContent = nameEnUpper;
            marqueeContainer.appendChild(span);
        }
    }

    /**
     * Placeholder 갤러리 아이템 생성 헬퍼 메서드
     */
    _createPlaceholderGalleryItem() {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item animate-element';

        const title = document.createElement('h3');
        title.className = 'gallery-item-title';
        title.textContent = '이미지 설명';

        const img = document.createElement('img');
        ImageHelpers.applyPlaceholder(img);

        galleryItem.appendChild(title);
        galleryItem.appendChild(img);
        return galleryItem;
    }

    /**
     * 갤러리 섹션 매핑 (customFields 우선)
     * homepage.customFields.pages.room[index].sections[0].gallery.title → [data-room-gallery-title]
     * customFields.roomtypes[].images (roomtype_exterior) → [data-room-gallery]
     */
    mapGallerySection() {
        const room = this.getCurrentRoom();
        if (!room) return;

        // 갤러리 제목 매핑 (CUSTOM FIELD)
        const galleryTitle = this.safeSelect('[data-room-gallery-title]');
        if (galleryTitle) {
            const roomPageData = this.getCurrentRoomPageData();
            const galleryTitleText = roomPageData?.data?.sections?.[0]?.gallery?.title;
            galleryTitle.textContent = this.sanitizeText(galleryTitleText, '객실 갤러리 타이틀');
        }

        // 갤러리 이미지 매핑 (customFields 우선)
        const galleryContainer = this.safeSelect('[data-room-gallery]');
        if (!galleryContainer) return;

        // customFields 이미지 사용
        const selectedImages = this.getRoomImages(room, 'roomtype_exterior');

        // 기존 갤러리 제거
        galleryContainer.innerHTML = '';

        const GALLERY_ITEM_COUNT = 3; // 갤러리 아이템 고정 개수

        if (selectedImages.length === 0) {
            // 이미지가 없을 경우 placeholder 3개 생성
            for (let i = 0; i < GALLERY_ITEM_COUNT; i++) {
                galleryContainer.appendChild(this._createPlaceholderGalleryItem());
            }
            return;
        }

        // 이미지 생성 (최대 3개)
        const galleryImages = selectedImages.slice(0, GALLERY_ITEM_COUNT);
        galleryImages.forEach((image, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item animate-element';

            const title = document.createElement('h3');
            title.className = 'gallery-item-title';
            title.textContent = this.sanitizeText(image.description, '이미지 설명');

            const img = document.createElement('img');
            img.src = image.url;
            img.alt = this.sanitizeText(image.description, room.name);
            img.loading = index === 0 ? 'eager' : 'lazy';

            galleryItem.appendChild(title);
            galleryItem.appendChild(img);
            galleryContainer.appendChild(galleryItem);
        });

        // 3개 미만일 경우 placeholder로 채움
        for (let i = galleryImages.length; i < GALLERY_ITEM_COUNT; i++) {
            galleryContainer.appendChild(this._createPlaceholderGalleryItem());
        }
    }



    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Room 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map room page: data not loaded');
            return;
        }

        const room = this.getCurrentRoom();
        if (!room) {
            console.error('Cannot map room page: room not found');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSlider();            // Hero slider at top
        this.mapBasicInfo();             // Room name, thumbnail, description
        this.mapRoomDetailSlider();      // Room detail slider + thumbnails
        this.mapRoomDetails();           // Size, bed types, composition, capacity, checkin, checkout, guide
        this.mapRoomAmenities();         // Amenities grid
        this.mapGallerySection();        // Exterior gallery section
        this.mapMarqueeSection();        // Property English name marquee

        // 메타 태그 업데이트 (페이지별 SEO 적용, customFields 우선)
        const roomNameForSEO = this.getRoomName(room);
        const propertyNameForSEO = this.getPropertyName();
        const pageSEO = {
            title: `${roomNameForSEO} - ${propertyNameForSEO}`,
            description: room?.description || this.data.property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // OG 이미지 업데이트 (객실 이미지 사용)
        this.updateOGImage(room);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // 슬라이더 재초기화는 이미지 onload에서 처리
        // this.reinitializeHeroSlider();

        // 애니메이션 재초기화 (동적 요소들에 대해)
        this.reinitializeAnimations();
    }

    /**
     * 애니메이션 재초기화
     */
    reinitializeAnimations() {
        if (typeof window.initRoomAnimations === 'function') {
            window.initRoomAnimations();
        }
    }


    /**
     * OG 이미지 업데이트 (customFields 객실 이미지 사용, 없으면 로고)
     * @param {Object} room - 현재 객실 데이터
     */
    updateOGImage(room) {
        if (!this.isDataLoaded || !room) return;

        const ogImage = this.safeSelect('meta[property="og:image"]');
        if (!ogImage) return;

        // customFields: thumbnail, interior, exterior 순으로 첫 번째 이미지 찾기
        const customThumbnails = this.getRoomImages(room, 'roomtype_thumbnail');
        const customInteriors = this.getRoomImages(room, 'roomtype_interior');
        const customExteriors = this.getRoomImages(room, 'roomtype_exterior');

        let imageUrl = null;

        if (customThumbnails.length > 0) {
            imageUrl = customThumbnails[0].url;
        } else if (customInteriors.length > 0) {
            imageUrl = customInteriors[0].url;
        } else if (customExteriors.length > 0) {
            imageUrl = customExteriors[0].url;
        }

        // 우선순위: 객실 이미지 > 로고 이미지
        if (imageUrl) {
            ogImage.setAttribute('content', imageUrl);
        } else {
            const defaultImage = this.getDefaultOGImage();
            if (defaultImage) {
                ogImage.setAttribute('content', defaultImage);
            }
        }
    }
}

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomMapper;
} else {
    window.RoomMapper = RoomMapper;
}

// ============================================================================
// 🚀 INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const roomMapper = new RoomMapper();

    try {
        // 데이터 로드
        await roomMapper.loadData();

        // 페이지 매핑 실행
        await roomMapper.mapPage();
    } catch (error) {
        console.error('Error initializing room mapper:', error);
    }
});
