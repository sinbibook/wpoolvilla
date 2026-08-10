/**
 * Layout Map Page Data Mapper
 * layout-map.html 전용 매핑 함수들을 포함한 클래스
 * BaseDataMapper를 상속받아 배치도 페이지 전용 기능 제공
 */
class LayoutMapMapper extends BaseDataMapper {
    constructor() {
        super();
    }

    // ============================================================================
    // 🏗️ LAYOUT MAP PAGE MAPPINGS
    // ============================================================================

    /**
     * 전체 페이지 매핑 (enabled 체크 포함)
     */
    async mapPage() {
        if (!this.isDataLoaded) {
            await this.loadData();
        }

        if (!this.isDataLoaded) {
            console.error('Data not loaded');
            return;
        }

        // enabled 체크: false면 404로 리다이렉트
        const isEnabled = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0.enabled');

        // 명시적으로 false인 경우만 404 리다이렉트 (undefined/null은 true로 간주)
        if (isEnabled === false) {
            console.warn('❌ layoutMap disabled (isEnabled === false) - redirecting to 404');
            const searchParams = window.location.search;
            window.location.href = '404.html' + searchParams;
            return;
        }
        // 매핑 실행
        this.mapHeroSlider();
        this.mapLayoutMapContent();
        this.mapBannerSection();
        this.mapMarqueeSection();

        // 메타 태그 및 SEO 업데이트 (인증코드 포함, 전 페이지 공통)
        this.updateMetaTags();

        // 애니메이션 초기화
        if (window.setupLayoutMapAnimations) {
            setTimeout(() => window.setupLayoutMapAnimations(), 100);
        }
    }

    /**
     * Hero Slider 매핑
     * homepage.customFields.pages.layoutMap.sections[0].hero.images
     */
    mapHeroSlider() {
        const sliderContainer = this.safeSelect('[data-hero-slider]');
        if (!sliderContainer) return;

        const images = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0.hero.images');
        if (!images || !Array.isArray(images)) {
            // 이미지 없으면 placeholder 슬라이드 1개 추가
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide active';
            const imgElement = document.createElement('img');
            ImageHelpers.applyPlaceholder(imgElement);
            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
            return;
        }

        // ImageHelpers로 선택된 이미지 필터링
        const selectedImages = ImageHelpers.getSelectedImages(images);

        sliderContainer.innerHTML = '';

        if (selectedImages.length === 0) {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide active';
            const imgElement = document.createElement('img');
            ImageHelpers.applyPlaceholder(imgElement);
            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
            return;
        }

        // 슬라이드 생성
        selectedImages.forEach((img, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'hero-slide';
            if (index === 0) slideDiv.classList.add('active');

            const imgElement = document.createElement('img');
            imgElement.src = img.url;
            imgElement.alt = this.sanitizeText(img.description, '배치도 이미지');
            imgElement.loading = index === 0 ? 'eager' : 'lazy';

            slideDiv.appendChild(imgElement);
            sliderContainer.appendChild(slideDiv);
        });

        // 슬라이드 총 개수 업데이트
        const totalSlidesEl = document.querySelector('[data-total-slides]');
        if (totalSlidesEl) {
            totalSlidesEl.textContent = String(selectedImages.length).padStart(2, '0');
        }
    }

    /**
     * Layout Map 콘텐츠 매핑
     * homepage.customFields.pages.layoutMap.sections[0].about
     */
    mapLayoutMapContent() {
        const about = this.safeGet(this.data, 'homepage.customFields.pages.layoutMap.sections.0.about');
        if (!about) return;

        // 제목 매핑
        const titleEl = this.safeSelect('[data-layout-map-title]');
        if (titleEl && about.title) {
            titleEl.textContent = this.sanitizeText(about.title);
        }

        // 설명 매핑
        const descEl = this.safeSelect('[data-layout-map-description]');
        if (descEl && about.description) {
            descEl.textContent = this.sanitizeText(about.description);
        }

        // 이미지들 매핑 (여러 개 수직 표시)
        const imagesContainer = this.safeSelect('[data-layout-map-images]');
        if (!imagesContainer) return;

        if (!about.images || !Array.isArray(about.images) || about.images.length === 0) {
            imagesContainer.innerHTML = '';
            return;
        }

        const selectedImages = ImageHelpers.getSelectedImages(about.images);
        imagesContainer.innerHTML = '';

        selectedImages.forEach((image) => {
            // 이미지 아이템 래퍼
            const itemEl = document.createElement('div');
            itemEl.className = 'layout-map-image-item animate-element';

            // 이미지 래퍼
            const imageWrapperEl = document.createElement('div');
            imageWrapperEl.className = 'layout-map-image-wrapper';

            // 이미지
            const imgEl = document.createElement('img');
            imgEl.src = image.url;
            imgEl.alt = this.sanitizeText(image.description, '배치도');

            imageWrapperEl.appendChild(imgEl);

            // 이미지 설명
            const descriptionEl = document.createElement('p');
            descriptionEl.className = 'layout-map-image-description';
            descriptionEl.textContent = this.sanitizeText(image.description || '');

            itemEl.appendChild(imageWrapperEl);
            itemEl.appendChild(descriptionEl);
            imagesContainer.appendChild(itemEl);
        });
    }

    /**
     * Full Banner 섹션 매핑
     * property.nameEn 사용
     */
    mapBannerSection() {
        const property = this.data?.property;
        if (!property) return;

        const bannerTitleEl = this.safeSelect('[data-property-name-en]');
        if (bannerTitleEl && property.nameEn) {
            bannerTitleEl.textContent = property.nameEn.toUpperCase();
        }

        // 첫 번째 exterior 이미지 사용
        const bannerBgEl = this.safeSelect('[data-layout-banner-bg]');
        if (bannerBgEl && property.images?.[0]?.exterior?.length > 0) {
            const exteriorImg = property.images[0].exterior[0];
            bannerBgEl.style.backgroundImage = `url('${exteriorImg.url}')`;
            bannerBgEl.style.backgroundSize = 'cover';
            bannerBgEl.style.backgroundPosition = 'center';
        }
    }

    /**
     * Marquee 섹션 매핑
     * property.nameEn 반복 (5개 span)
     */
    mapMarqueeSection() {
        const marqueeEl = this.safeSelect('[data-marquee-property-name]');
        if (!marqueeEl) return;

        const property = this.data?.property;
        const name = property?.nameEn?.toUpperCase() || 'PROPERTY';

        marqueeEl.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const spanEl = document.createElement('span');
            spanEl.textContent = name;
            if (i < 4) {
                const dividerEl = document.createElement('span');
                dividerEl.innerHTML = '&nbsp;&nbsp;•&nbsp;&nbsp;';
                marqueeEl.appendChild(spanEl);
                marqueeEl.appendChild(dividerEl);
            } else {
                marqueeEl.appendChild(spanEl);
            }
        }
    }
}

// 글로벌 스코프에 노출
window.LayoutMapMapper = LayoutMapMapper;
