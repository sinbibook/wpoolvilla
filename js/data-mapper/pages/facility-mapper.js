/**
 * Facility Page Data Mapper
 * facility.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 시설 페이지 전용 기능 제공
 * URL 파라미터로 ?id=facility-uuid를 받아서 동적으로 시설 정보 표시
 */
class FacilityMapper extends BaseDataMapper {
    constructor() {
        super();
        this.currentFacility = null;
        this.currentFacilityIndex = null;
    }

    // ============================================================================
    // 🏢 FACILITY PAGE SPECIFIC MAPPINGS
    // ============================================================================

    /**
     * 현재 시설 정보 가져오기 (URL 파라미터 기반)
     */
    getCurrentFacility() {
        if (!this.isDataLoaded || !this.data.property?.facilities) {
            console.error('Data not loaded or no facilities data available');
            return null;
        }

        // URL에서 facility id 추출
        const urlParams = new URLSearchParams(window.location.search);
        const facilityId = urlParams.get('id');

        if (!facilityId) {
            console.error('Facility id not specified in URL');
            return null;
        }

        // facilities 배열에서 해당 id의 시설 찾기
        const facilityIndex = this.data.property.facilities.findIndex(facility => facility.id === facilityId);

        if (facilityIndex === -1) {
            console.error(`Facility with id ${facilityId} not found`);
            return null;
        }

        const facility = this.data.property.facilities[facilityIndex];
        this.currentFacility = facility;
        this.currentFacilityIndex = facilityIndex;
        return facility;
    }

    /**
     * 현재 시설의 customFields 페이지 데이터 가져오기
     */
    getCurrentFacilityPageData() {
        const facility = this.getCurrentFacility();
        if (!facility) return null;

        const facilityPages = this.data.homepage?.customFields?.pages?.facility;
        if (!Array.isArray(facilityPages)) return null;

        return facilityPages.find(page => page.id === facility.id);
    }

    /**
     * Hero Slider 매핑 (facility.images 전체 순서대로)
     */
    mapHeroSlider() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const sliderInner = this.safeSelect('[data-hero-slider]');
        if (!sliderInner) return;

        // ImageHelpers로 선택된 이미지 가져오기
        const selectedImages = ImageHelpers.getSelectedImages(facility.images);

        sliderInner.innerHTML = '';

        if (selectedImages.length === 0) {
            // 이미지 없을 때 placeholder
            const slide = document.createElement('div');
            slide.className = 'hero-slide active';
            const img = document.createElement('img');
            ImageHelpers.applyPlaceholder(img);
            slide.appendChild(img);
            sliderInner.appendChild(slide);
            return;
        }

        // 슬라이드 생성
        selectedImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = `hero-slide${index === 0 ? ' active' : ''}`;
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.description || facility.name;
            img.loading = index === 0 ? 'eager' : 'lazy';

            // 첫 번째 이미지가 로드되면 슬라이더 초기화
            if (index === 0) {
                img.onload = () => {
                    // DOM 렌더링 완료를 위한 최소 지연 (슬라이더 레이아웃 계산에 필요)
                    setTimeout(() => {
                        if (typeof window.initFacilityHeroSlider === 'function') {
                            window.initFacilityHeroSlider();
                        }
                    }, 100);
                };
            }

            slide.appendChild(img);
            sliderInner.appendChild(slide);
        });

        // 슬라이더 인디케이터 매핑
        const totalSlidesEl = this.safeSelect('[data-total-slides]');
        if (totalSlidesEl) {
            totalSlidesEl.textContent = selectedImages.length.toString().padStart(2, '0');
        }
    }

    /**
     * 썸네일 이미지 매핑
     */
    mapThumbnail() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const thumbnailContainer = this.safeSelect('[data-facility-thumbnail]');
        if (!thumbnailContainer) return;

        const img = thumbnailContainer.querySelector('img');
        if (!img) return;

        const selectedImages = ImageHelpers.getSelectedImages(facility.images);
        // 첫 번째 이미지를 썸네일로 사용
        const thumbnailImage = selectedImages[0];

        if (thumbnailImage && thumbnailImage.url) {
            img.src = thumbnailImage.url;
            img.alt = thumbnailImage.description || facility.name;
            img.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(img);
        }
    }

    /**
     * 메인 이미지 매핑
     */
    mapMainImage() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const mainImageContainer = this.safeSelect('[data-facility-main-image]');
        if (!mainImageContainer) return;

        const img = mainImageContainer.querySelector('img');
        if (!img) return;

        const selectedImages = ImageHelpers.getSelectedImages(facility.images);
        // 두 번째 이미지를 메인 이미지로 사용 (없으면 첫 번째)
        const mainImage = selectedImages[1] || selectedImages[0];

        if (mainImage && mainImage.url) {
            img.src = mainImage.url;
            img.alt = mainImage.description || facility.name;
            img.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(img);
        }
    }

    /**
     * 기본 정보 매핑 (시설명, 시설 설명, 시설 번호)
     */
    mapBasicInfo() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        // 시설명 매핑 (시스템 데이터)
        const facilityTitle = this.safeSelect('[data-facility-title]');
        if (facilityTitle) {
            facilityTitle.textContent = facility.name || '시설명';
        }

        // 시설 설명 매핑 (CUSTOM FIELD: hero.title)
        const facilityDescription = this.safeSelect('[data-facility-description]');
        if (facilityDescription) {
            const facilityPageData = this.getCurrentFacilityPageData();
            const heroTitle = facilityPageData?.sections?.[0]?.hero?.title;
            facilityDescription.innerHTML = this._formatTextWithLineBreaks(heroTitle, '메인 소개 타이틀');
        }

        // 시설 번호 매핑 (인덱스 기반)
        const facilityNumber = this.safeSelect('[data-facility-number]');
        if (facilityNumber) {
            const index = this.currentFacilityIndex !== null ? this.currentFacilityIndex + 1 : 1;
            facilityNumber.textContent = index.toString().padStart(2, '0');
        }
    }

    /**
     * 시설 상세 설명 매핑
     */
    mapDetailDescription() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const descriptionContainer = this.safeSelect('[data-facility-detail-description]');
        if (!descriptionContainer) return;

        // CUSTOM FIELD 우선, 없으면 시스템 데이터
        const facilityPageData = this.getCurrentFacilityPageData();
        const heroDescription = facilityPageData?.sections?.[0]?.hero?.description;
        const description = heroDescription || facility.description;

        if (description) {
            descriptionContainer.innerHTML = this._formatTextWithLineBreaks(description);
        } else {
            descriptionContainer.innerHTML = `<p>${facility.name} 상세 설명이 준비 중입니다.</p>`;
        }
    }

    /**
     * 주요특징 매핑 (CUSTOM FIELD)
     */
    mapFeatures(features) {
        const featuresContainer = this.safeSelect('[data-facility-features]');
        if (!featuresContainer) return;

        const cardElement = featuresContainer.closest('.facility-info-card');

        if (!features || !Array.isArray(features) || features.length === 0) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        // 모든 아이템이 디폴트 값인지 체크
        const isAllDefault = features.every(feature =>
            feature.title === '특징 타이틀' && feature.description === '특징 설명'
        );

        if (isAllDefault) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        if (cardElement) cardElement.style.display = '';

        // ul 리스트로 생성
        const ul = document.createElement('ul');
        features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature.title || feature.description || '';
            ul.appendChild(li);
        });

        featuresContainer.innerHTML = '';
        featuresContainer.appendChild(ul);
    }

    /**
     * 추가정보 매핑 (CUSTOM FIELD)
     */
    mapAdditionalInfo(additionalInfo) {
        const additionalInfoContainer = this.safeSelect('[data-facility-additional-info]');
        if (!additionalInfoContainer) return;

        const cardElement = additionalInfoContainer.closest('.facility-info-card');

        if (!additionalInfo || !Array.isArray(additionalInfo) || additionalInfo.length === 0) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        // 모든 아이템이 디폴트 값인지 체크
        const isAllDefault = additionalInfo.every(info =>
            info.title === '추가정보 타이틀' && info.description === '추가정보 설명'
        );

        if (isAllDefault) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        if (cardElement) cardElement.style.display = '';

        // ul 리스트로 생성
        const ul = document.createElement('ul');
        additionalInfo.forEach(info => {
            const li = document.createElement('li');
            li.textContent = info.title || info.description || '';
            ul.appendChild(li);
        });

        additionalInfoContainer.innerHTML = '';
        additionalInfoContainer.appendChild(ul);
    }

    /**
     * 이용혜택 매핑 (CUSTOM FIELD)
     */
    mapBenefits(benefits) {
        const benefitsContainer = this.safeSelect('[data-facility-benefits]');
        if (!benefitsContainer) return;

        const cardElement = benefitsContainer.closest('.facility-info-card');

        if (!benefits || !Array.isArray(benefits) || benefits.length === 0) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        // 모든 아이템이 디폴트 값인지 체크
        const isAllDefault = benefits.every(benefit =>
            benefit.title === '혜택 타이틀' && benefit.description === '혜택 설명'
        );

        if (isAllDefault) {
            if (cardElement) cardElement.style.display = 'none';
            return;
        }

        if (cardElement) cardElement.style.display = '';

        // ul 리스트로 생성
        const ul = document.createElement('ul');
        benefits.forEach(benefit => {
            const li = document.createElement('li');
            li.textContent = benefit.title || benefit.description || '';
            ul.appendChild(li);
        });

        benefitsContainer.innerHTML = '';
        benefitsContainer.appendChild(ul);
    }

    /**
     * Marquee 매핑 (customFields 우선)
     */
    mapMarquee() {
        const marqueeContainer = this.safeSelect('[data-marquee-property-name]');
        if (!marqueeContainer) return;

        // customFields 우선
        const propertyNameEn = this.getPropertyNameEn();

        marqueeContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const span = document.createElement('span');
            span.textContent = propertyNameEn;
            marqueeContainer.appendChild(span);
        }
    }

    /**
     * 갤러리 매핑 (facility.images 최대 3장, 있는 만큼만 동적 생성)
     * - 이미지 1~3개: 개수만큼 생성 (가로폭은 CSS flex로 균등 분배)
     * - 이미지 0개: #GALLERY 섹션 전체 숨김
     */
    mapGallery() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const galleryContainer = this.safeSelect('[data-facility-gallery]');
        if (!galleryContainer) return;

        const gallerySection = galleryContainer.closest('.facility-gallery-section');

        // 갤러리 상수 정의
        const HERO_IMAGES_COUNT = 2; // Hero/Thumbnail에서 사용하는 이미지 수
        const GALLERY_IMAGES_COUNT = 3; // 갤러리에 표시할 최대 이미지 수

        // ImageHelpers로 선택된 이미지 가져오기
        const selectedImages = ImageHelpers.getSelectedImages(facility.images);

        // 갤러리 컨테이너 초기화
        galleryContainer.innerHTML = '';

        // 갤러리용 이미지 (Hero/Thumbnail 이후 이미지들)
        const galleryImages = selectedImages.slice(HERO_IMAGES_COUNT, HERO_IMAGES_COUNT + GALLERY_IMAGES_COUNT);

        // 이미지가 없으면 갤러리 섹션 자체를 숨김
        if (galleryImages.length === 0) {
            if (gallerySection) gallerySection.style.display = 'none';
            galleryContainer.removeAttribute('data-gallery-count');
            return;
        }

        if (gallerySection) gallerySection.style.display = '';

        // 개수를 속성으로 노출 (CSS에서 레이아웃 분기 시 활용)
        galleryContainer.setAttribute('data-gallery-count', String(galleryImages.length));

        // 갤러리 아이템 생성 (있는 만큼만, placeholder 채움 없음)
        galleryImages.forEach(image => {
            const item = this._createGalleryItem(image, facility.name);
            galleryContainer.appendChild(item);
        });
    }

    /**
     * 갤러리 아이템 생성 헬퍼
     * - image.description이 비어있으면 제목(#) 자체를 생성하지 않음
     */
    _createGalleryItem(image, facilityName) {
        const item = document.createElement('div');
        item.className = 'gallery-item animate-element';

        // 이미지 설명 (빈 값이면 미노출)
        const description = image ? this.sanitizeText(image.description) : '';
        if (description) {
            const title = document.createElement('h3');
            title.className = 'gallery-item-title';
            title.textContent = description;
            item.appendChild(title);
        }

        const img = document.createElement('img');
        if (image && image.url) {
            img.src = image.url;
            img.alt = description || facilityName;
            img.classList.remove('empty-image-placeholder');
        } else {
            ImageHelpers.applyPlaceholder(img);
        }

        item.appendChild(img);

        return item;
    }

    // ============================================================================
    // 🔄 TEMPLATE METHODS IMPLEMENTATION
    // ============================================================================

    /**
     * Facility 페이지 전체 매핑 실행
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            console.error('Cannot map facility page: data not loaded');
            return;
        }

        const facility = this.getCurrentFacility();
        if (!facility) {
            console.error('Cannot map facility page: facility not found');
            return;
        }

        // 순차적으로 각 섹션 매핑
        this.mapHeroSlider();           // Hero slider
        this.mapThumbnail();            // 썸네일 이미지
        this.mapBasicInfo();            // 시설명, 시설 설명
        this.mapMainImage();            // 메인 이미지
        this.mapDetailDescription();    // 시설 상세 설명
        this.mapInfoCards();            // 주요특징, 추가정보, 이용혜택
        this.mapGallery();              // Gallery
        this.mapMarquee();              // Marquee

        // 메타 태그 업데이트 (페이지별 SEO 적용, customFields 우선)
        const propertyNameForSEO = this.getPropertyName();
        const pageSEO = {
            title: `${facility?.name || '시설'} - ${propertyNameForSEO}`,
            description: facility?.description || this.data.property?.description || 'SEO 설명'
        };
        this.updateMetaTags(pageSEO);

        // E-commerce registration 매핑
        this.mapEcommerceRegistration();

        // 애니메이션 재초기화
        if (typeof window.initFacilityAnimations === 'function') {
            window.initFacilityAnimations();
        }
    }

    /**
     * 정보 카드 매핑 (주요특징, 추가정보, 이용혜택)
     */
    mapInfoCards() {
        const facility = this.getCurrentFacility();
        if (!facility) return;

        const facilityPageData = this.getCurrentFacilityPageData();
        const experience = facilityPageData?.sections?.[0]?.experience;

        // 주요특징 매핑
        this.mapFeatures(experience?.features);

        // 추가정보 매핑
        this.mapAdditionalInfo(experience?.additionalInfos);

        // 이용혜택 매핑
        this.mapBenefits(experience?.benefits);
    }
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', async () => {
    const facilityMapper = new FacilityMapper();
    try {
        await facilityMapper.loadData();
        await facilityMapper.mapPage();
    } catch (error) {
        console.error('Error initializing facility mapper:', error);
    }
});

// ES6 모듈 및 글로벌 노출
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FacilityMapper;
} else {
    window.FacilityMapper = FacilityMapper;
}
