/**
 * Hero Slider with Zoom Animation
 */
class HeroSlider {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.slideDuration = 4000; // 4초
        this.slides = [];
        this.progressFill = null;
        this.sliderContainer = null;
        this.autoSlideInterval = null;
    }

    init() {
        this.sliderContainer = document.querySelector('[data-hero-slider]');
        this.progressFill = document.querySelector('[data-hero-progress]');

        if (!this.sliderContainer) return;

        this.loadSlides();

        // 슬라이드가 1개 이하면 자동슬라이드 비활성화
        // (줌인은 loadSlides()에서 이미 시작했으므로 다시 호출하지 않음 — 중복 호출 시 되감김 발생)
        if (this.totalSlides <= 1) {
            this.updateIndicators();
            return;
        }

        this.updateIndicators();
        this.startAutoSlide();
    }

    loadSlides() {
        // mapper가 생성한 슬라이드 사용
        this.slides = Array.from(this.sliderContainer.querySelectorAll('.hero-slide'));
        this.totalSlides = this.slides.length;

        // 첫 번째 슬라이드 줌인 시작
        if (this.slides[0]) {
            this.startZoomAnimation(this.slides[0]);
        }
    }

    startZoomAnimation(slide) {
        const img = slide.querySelector('img');
        if (!img) return;

        // 줌 아웃 상태로 초기화 (트랜지션을 먼저 끊고 위치를 잡아야 되감기가 안 보임)
        img.style.transition = 'none';
        img.style.transform = 'scale(1)';

        const startZoom = () => {
            // 다음 프레임에서 트랜지션 복원 → 그 다음 프레임에서 줌인 시작
            requestAnimationFrame(() => {
                img.style.transition = `transform ${this.slideDuration}ms ease-out`;
                requestAnimationFrame(() => {
                    img.style.transform = 'scale(1.15)';
                });
            });
        };

        // 이미지가 아직 로드 전이면 로드 후에 줌 시작 (그리기 전에 애니메이션이 진행되는 것 방지)
        if (img.complete && img.naturalWidth > 0) {
            startZoom();
        } else {
            img.addEventListener('load', startZoom, { once: true });
        }
    }

    nextSlide() {
        // 현재 슬라이드를 비활성화
        this.slides[this.currentSlide].classList.remove('active');

        // 다음 슬라이드로 이동
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;

        // 새 슬라이드 활성화
        this.slides[this.currentSlide].classList.add('active');

        // 줌인 애니메이션 시작
        this.startZoomAnimation(this.slides[this.currentSlide]);

        // 인디케이터 업데이트
        this.updateIndicators();
    }

    updateIndicators() {
        const currentEl = document.querySelector('[data-current-slide]');
        const totalEl = document.querySelector('[data-total-slides]');

        if (currentEl) {
            currentEl.textContent = String(this.currentSlide + 1).padStart(2, '0');
        }
        if (totalEl) {
            totalEl.textContent = String(this.totalSlides).padStart(2, '0');
        }
    }

    animateProgress() {
        if (!this.progressFill) return;

        // 프로그레스바 초기화
        this.progressFill.style.transition = 'none';
        this.progressFill.style.width = '0%';

        // 강제 리플로우
        this.progressFill.offsetHeight;

        // 애니메이션 시작
        setTimeout(() => {
            this.progressFill.style.transition = `width ${this.slideDuration}ms linear`;
            this.progressFill.style.width = '100%';
        }, 50);
    }

    startAutoSlide() {
        // 첫 번째 프로그레스바 애니메이션 시작
        this.animateProgress();

        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
            this.animateProgress();
        }, this.slideDuration);
    }

    stop() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }
}

/**
 * Gallery Slider - Flex 기반 깔끔한 캐러셀
 */
class GallerySlider {
    constructor() {
        this.slider = null;
        this.index = 0;
        this.intervalId = null;
        this.slideDuration = 3000; // 3초마다 슬라이드
        this.slideCount = 0;

        // 상수 정의
        this.SLIDE_GAP = 30;           // 슬라이드 간 간격 (px)
        this.TRANSITION = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        this.DRAG_THRESHOLD = 5;       // 클릭과 드래그를 구분하는 이동량 (px)

        // 드래그 상태
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragDelta = 0;
        this.dragMoved = false;
        this.pointerId = null;
        this.dragHandlers = null;
    }

    init() {
        this.slider = document.querySelector('[data-gallery-slider]');
        if (!this.slider) {
            return;
        }

        this.setupGallery();
    }

    setupGallery() {
        // mapper가 생성한 슬라이드 읽기
        const originalSlides = Array.from(this.slider.querySelectorAll('.gallery-item'));
        this.slideCount = originalSlides.length;

        // 슬라이드가 없으면 종료
        if (this.slideCount === 0) {
            return;
        }

        // 무한 루프를 위해 원본 이미지들을 여러 번 복제 (3번 더 복제해서 총 4세트)
        for (let i = 0; i < 3; i++) {
            originalSlides.forEach(slide => {
                this.slider.appendChild(slide.cloneNode(true));
            });
        }

        // 시작 위치 설정
        this.index = 0;

        // 슬라이드 시작
        this.startSlider();
    }

    addFadeOverlays() {
        const galleryContainer = document.querySelector('.gallery-container');

        if (galleryContainer) {
            // 왼쪽 페이드 오버레이
            const leftOverlay = document.createElement('div');
            leftOverlay.className = 'gallery-fade-left';
            leftOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 200px;
                height: 100%;
                background: linear-gradient(to right, rgba(255, 236, 210, 1) 0%, rgba(255, 236, 210, 0.8) 20%, rgba(255, 236, 210, 0) 100%);
                pointer-events: none;
                z-index: 100;
            `;

            // 오른쪽 페이드 오버레이
            const rightOverlay = document.createElement('div');
            rightOverlay.className = 'gallery-fade-right';
            rightOverlay.style.cssText = `
                position: absolute;
                top: 0;
                right: 0;
                width: 200px;
                height: 100%;
                background: linear-gradient(to left, rgba(255, 236, 210, 1) 0%, rgba(255, 236, 210, 0.8) 20%, rgba(255, 236, 210, 0) 100%);
                pointer-events: none;
                z-index: 100;
            `;

            galleryContainer.appendChild(leftOverlay);
            galleryContainer.appendChild(rightOverlay);
        }
    }

    startSlider() {
        // 시작 위치를 두 번째 세트로 보정 (왼쪽으로 드래그할 공간 확보)
        this.syncWrap();
        this.applyTransform(false);

        // 드래그 스크롤 활성화
        this.enableDrag();

        // 자동 슬라이드 활성화 (지연 없이 바로 시작)
        this.intervalId = setInterval(() => {
            if (!this.isDragging) {
                this.move();
            }
        }, this.slideDuration);
    }

    /**
     * 아이템 1개 이동 거리 (너비 + gap)
     */
    getItemWidth() {
        const firstItem = this.slider.querySelector('.gallery-item');
        if (!firstItem) return 0;
        return firstItem.offsetWidth + this.SLIDE_GAP;
    }

    /**
     * 현재 index 기준 위치 적용
     * @param {boolean} animate - 애니메이션 여부
     * @param {number} offset - 드래그 중 추가 이동량 (px)
     */
    applyTransform(animate, offset = 0) {
        const itemWidth = this.getItemWidth();
        this.slider.style.transition = animate ? this.TRANSITION : 'none';
        this.slider.style.transform = `translateX(${-this.index * itemWidth + offset}px)`;
    }

    /**
     * index를 [slideCount, slideCount*2) 범위로 보정
     * 모든 세트가 동일한 이미지라 위치를 즉시 옮겨도 시각적으로 동일 (무한 루프)
     * @returns {boolean} 보정이 일어났으면 true
     */
    syncWrap() {
        const n = this.slideCount;
        if (n <= 0) return false;

        let wrapped = false;
        while (this.index >= n * 2) { this.index -= n; wrapped = true; }
        while (this.index < n) { this.index += n; wrapped = true; }
        return wrapped;
    }

    move() {
        if (!this.getItemWidth()) return;

        // 애니메이션 시작 전에 위치 보정 (보정 시점에는 화면이 동일해서 티가 나지 않음)
        if (this.syncWrap()) {
            this.applyTransform(false);
            void this.slider.offsetWidth; // 리플로우
        }

        this.index += 1;
        this.applyTransform(true);
    }

    // ========================================================================
    // 🖱️ 드래그 스크롤
    // ========================================================================
    enableDrag() {
        this.slider.style.cursor = 'grab';
        this.slider.style.touchAction = 'pan-y'; // 세로 스크롤은 그대로 두고 가로만 처리

        const onPointerDown = (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (!this.getItemWidth()) return;

            // 드래그 시작 전 위치 보정 (양쪽으로 이동할 여유 확보)
            if (this.syncWrap()) this.applyTransform(false);

            this.isDragging = true;
            this.dragMoved = false;
            this.dragStartX = e.clientX;
            this.dragDelta = 0;
            this.pointerId = e.pointerId;

            this.slider.style.cursor = 'grabbing';
            this.slider.style.userSelect = 'none';
            this.slider.style.transition = 'none';

            if (this.slider.setPointerCapture) {
                this.slider.setPointerCapture(e.pointerId);
            }
        };

        const onPointerMove = (e) => {
            if (!this.isDragging || e.pointerId !== this.pointerId) return;

            const itemWidth = this.getItemWidth();
            const maxDrag = itemWidth * this.slideCount; // 한 번에 최대 한 세트까지만

            this.dragDelta = Math.max(-maxDrag, Math.min(maxDrag, e.clientX - this.dragStartX));
            if (Math.abs(this.dragDelta) > this.DRAG_THRESHOLD) this.dragMoved = true;

            this.applyTransform(false, this.dragDelta);
        };

        const onPointerUp = (e) => {
            if (!this.isDragging || e.pointerId !== this.pointerId) return;

            this.isDragging = false;
            this.pointerId = null;
            this.slider.style.cursor = 'grab';
            this.slider.style.userSelect = '';

            if (this.slider.releasePointerCapture && this.slider.hasPointerCapture?.(e.pointerId)) {
                this.slider.releasePointerCapture(e.pointerId);
            }

            // 가장 가까운 슬라이드로 스냅
            const itemWidth = this.getItemWidth();
            if (itemWidth) {
                this.index += Math.round(-this.dragDelta / itemWidth);
            }
            this.dragDelta = 0;
            this.applyTransform(true);
        };

        // 드래그로 끝난 제스처는 클릭으로 처리하지 않음
        const onClick = (e) => {
            if (this.dragMoved) {
                e.preventDefault();
                e.stopPropagation();
                this.dragMoved = false;
            }
        };

        // 이미지 기본 드래그(고스트 이미지) 방지
        const onDragStart = (e) => e.preventDefault();

        this.dragHandlers = { onPointerDown, onPointerMove, onPointerUp, onClick, onDragStart };

        this.slider.addEventListener('pointerdown', onPointerDown);
        this.slider.addEventListener('pointermove', onPointerMove);
        this.slider.addEventListener('pointerup', onPointerUp);
        this.slider.addEventListener('pointercancel', onPointerUp);
        this.slider.addEventListener('click', onClick, true);
        this.slider.addEventListener('dragstart', onDragStart);
    }

    disableDrag() {
        if (!this.slider || !this.dragHandlers) return;

        const h = this.dragHandlers;
        this.slider.removeEventListener('pointerdown', h.onPointerDown);
        this.slider.removeEventListener('pointermove', h.onPointerMove);
        this.slider.removeEventListener('pointerup', h.onPointerUp);
        this.slider.removeEventListener('pointercancel', h.onPointerUp);
        this.slider.removeEventListener('click', h.onClick, true);
        this.slider.removeEventListener('dragstart', h.onDragStart);
        this.dragHandlers = null;
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.disableDrag();
    }
}

/**
 * Fullpage Scroll
 */
class FullpageScroll {
    constructor() {
        this.sections = [];
        this.currentSection = 0;
        this.isScrolling = false;
        this.wheelTimeout = null;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isInFooter = false;

        this.init();
    }

    init() {
        // 모바일에서는 fullpage scroll 비활성화
        if (window.innerWidth <= 768) {
            // 모바일에서 일반 스크롤 활성화
            document.body.style.overflow = 'auto';
            document.body.style.height = 'auto';

            // fullpage 컨테이너 스타일 변경
            const fullpage = document.getElementById('fullpage');
            if (fullpage) {
                fullpage.style.height = 'auto';
            }

            // 모든 섹션 높이 자동으로 변경
            const sections = document.querySelectorAll('.section');
            sections.forEach(section => {
                section.style.height = 'auto';
                section.style.minHeight = (section.classList.contains('hero-section') || section.classList.contains('closing-section')) ? '50vh' : '100vh';
            });

            // fp-section 클래스 제거
            document.querySelectorAll('.fp-section').forEach(el => {
                el.classList.remove('fp-section');
            });

            // Navigation dots 숨기기
            const fpNav = document.querySelector('.fp-nav');
            if (fpNav) {
                fpNav.style.display = 'none';
            }

            return;
        }

        this.sections = document.querySelectorAll('.fp-section');
        this.initNavigation();
        this.initScrollListener();
        this.initWheelListener();
        this.initTouchListener();
        this.updateActiveSection();
    }

    /**
     * 섹션 목록 갱신 (모바일 ↔ 데스크톱 폭 전환 후 fp-section이 다시 붙었을 때)
     */
    refresh() {
        this.sections = document.querySelectorAll('.fp-section');
        this.isScrolling = false;
        this.updateActiveSection();
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.fp-nav a');
        navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToSection(index);
            });
        });
    }

    initScrollListener() {
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateActiveSection();
            }, 100);
        });
    }

    initWheelListener() {
        window.addEventListener('wheel', (e) => {
            // 모바일 폭에서는 풀페이지 스크롤을 쓰지 않음 (창 크기 변경/디바이스 모드 대응)
            if (window.innerWidth <= 768) return;

            // 메뉴 오버레이가 열려 있으면 풀페이지 스크롤을 막고 메뉴 내부 스크롤 허용
            if (document.querySelector('.menu-overlay.active')) return;

            if (this.isScrolling) {
                e.preventDefault();
                return;
            }

            // 마지막 섹션에서 아래로 스크롤하거나 푸터 영역에 있으면 일반 스크롤 허용
            const lastSection = this.sections[this.sections.length - 1];
            const lastSectionBottom = lastSection.offsetTop + lastSection.offsetHeight;
            const currentScrollPosition = window.scrollY + window.innerHeight;

            if (currentScrollPosition >= lastSectionBottom || this.isInFooter) {
                return; // 일반 스크롤 허용
            }

            e.preventDefault();

            clearTimeout(this.wheelTimeout);
            this.wheelTimeout = setTimeout(() => {
                if (e.deltaY > 0) {
                    // 아래로 스크롤
                    this.nextSection();
                } else {
                    // 위로 스크롤
                    this.prevSection();
                }
            }, 50);
        }, { passive: false });
    }

    initTouchListener() {
        window.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            // 모바일 폭에서는 스와이프를 가로채지 않고 일반 스크롤 사용
            if (window.innerWidth <= 768) return;
            if (document.querySelector('.menu-overlay.active')) return;
            if (this.isScrolling) return;

            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - this.touchStartTime;
            const touchDistance = Math.abs(touchEndY - this.touchStartY);

            // 최소 거리와 최대 시간 체크 (스와이프 감지)
            if (touchDistance > 50 && touchDuration < 500) {
                // 마지막 섹션에서 아래로 스와이프하거나 푸터 영역에 있으면 일반 스크롤 허용
                const lastSection = this.sections[this.sections.length - 1];
                const lastSectionBottom = lastSection.offsetTop + lastSection.offsetHeight;
                const currentScrollPosition = window.scrollY + window.innerHeight;

                if (currentScrollPosition >= lastSectionBottom || this.isInFooter) {
                    return; // 일반 스크롤 허용
                }

                if (touchEndY < this.touchStartY) {
                    // 아래로 스와이프
                    this.nextSection();
                } else {
                    // 위로 스와이프
                    this.prevSection();
                }
            }
        }, { passive: true });
    }

    updateActiveSection() {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        const footer = document.querySelector('.footer');

        // 푸터 영역 체크
        if (footer) {
            const footerTop = footer.offsetTop;
            this.isInFooter = window.scrollY + window.innerHeight > footerTop;
        }

        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                this.currentSection = index;
                this.updateNavigation();

                // 갤러리 또는 클로징 섹션 체크
                if (section.classList.contains('gallery-section') || section.classList.contains('closing-section')) {
                    document.body.classList.add('dark-section-active');
                } else {
                    document.body.classList.remove('dark-section-active');
                }

                // Footer 가시성 체크 (스크롤 끝)
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

                // 스크롤이 거의 끝에 도달했을 때 (footer가 보일 때)
                if (scrollTop + windowHeight >= documentHeight - 100) {
                    document.body.classList.add('footer-visible');
                } else {
                    document.body.classList.remove('footer-visible');
                }
            }
        });
    }

    updateNavigation() {
        const navLinks = document.querySelectorAll('.fp-nav a');
        navLinks.forEach((link, index) => {
            if (index === this.currentSection) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    nextSection() {
        if (this.currentSection < this.sections.length - 1) {
            this.goToSection(this.currentSection + 1);
        } else {
            // 마지막 섹션에서 푸터로 스크롤
            const footer = document.querySelector('.footer');
            if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    prevSection() {
        if (this.currentSection > 0) {
            this.goToSection(this.currentSection - 1);
        }
    }

    goToSection(index) {
        if (this.isScrolling || index < 0 || index >= this.sections.length) return;

        this.isScrolling = true;
        this.currentSection = index;

        const targetSection = this.sections[index];
        targetSection.scrollIntoView({ behavior: 'smooth' });

        this.updateNavigation();

        // 애니메이션 트리거
        this.triggerSectionAnimation(targetSection);

        // 스크롤 완료 후 잠금 해제
        setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    triggerSectionAnimation(section) {
        // 모든 섹션의 애니메이션 리셋
        this.sections.forEach(s => {
            const elements = s.querySelectorAll('.animate-element');
            elements.forEach(el => {
                el.classList.remove('animate');
                // 강제 리플로우
                el.offsetHeight;
            });
        });

        // 히어로 섹션(첫 번째 섹션)은 스킵
        if (section.classList.contains('hero-section')) {
            return;
        }

        // 현재 섹션의 애니메이션 트리거 (약간의 지연 후)
        setTimeout(() => {
            const elements = section.querySelectorAll('.animate-element');
            elements.forEach(el => {
                // 인라인 스타일 제거 (CSS가 처리하도록)
                el.style.removeProperty('opacity');
                el.style.removeProperty('transform');
                el.classList.add('animate');
            });
        }, 200);
    }

    // 페이지 로드 시 현재 섹션의 텍스트 즉시 표시 (새로고침 시)
    checkAndTriggerCurrentSectionAnimation() {
        // 현재 스크롤 위치에 따라 활성 섹션 결정
        const scrollPosition = window.scrollY + window.innerHeight / 2;

        for (const [index, section] of this.sections.entries()) {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition <= sectionBottom) {
                this.currentSection = index;

                // 히어로 섹션이 아닌 경우에만 텍스트 즉시 표시
                if (!section.classList.contains('hero-section')) {
                    const elements = section.querySelectorAll('.animate-element');

                    // 새로고침 시 텍스트를 즉시 표시 (애니메이션 없이)
                    elements.forEach(el => {
                        // 애니메이션 클래스 추가하고 즉시 표시
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.classList.add('animate');
                    });
                }

                this.updateNavigation();
                return;
            }
        }
    }
}

/**
 * 스크롤 감지 및 UI 업데이트
 */
function initScrollDetection() {
    function updateScrollState() {
        const scrolled = window.scrollY > 50;

        if (scrolled) {
            document.body.classList.add('scrolled');
        } else {
            document.body.classList.remove('scrolled');
        }
    }

    // 초기 상태 설정
    updateScrollState();

    // 스크롤 이벤트 리스너
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateScrollState();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// 모바일 스크롤 애니메이션 초기화 함수
function initMobileAnimations() {
    const animateElements = document.querySelectorAll('.animate-element');

    if (!animateElements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 약간의 지연을 두고 애니메이션 실행
                setTimeout(() => {
                    entry.target.classList.add('animate');
                }, entry.target.dataset.delay || 0);
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    animateElements.forEach((element, index) => {
        // 순차적 애니메이션을 위한 지연 시간 설정
        element.dataset.delay = index * 100;
        observer.observe(element);
    });
}

// 모바일 일반 스크롤 활성화 함수
function enableMobileScroll() {
    // body와 html 스크롤 활성화
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';

    // fullpage 컨테이너 스타일 초기화
    const fullpage = document.getElementById('fullpage');
    if (fullpage) {
        fullpage.style.height = 'auto';
        fullpage.style.overflow = 'visible';
    }

    // 모든 섹션 높이 자동으로
    const sections = document.querySelectorAll('.section, .fp-section');
    sections.forEach(section => {
        section.style.height = 'auto';
        section.style.minHeight = (section.classList.contains('hero-section') || section.classList.contains('closing-section')) ? '50vh' : '100vh';
        section.classList.remove('fp-section');
    });

    // Navigation dots 숨기기
    const fpNav = document.querySelector('.fp-nav');
    if (fpNav) {
        fpNav.style.display = 'none';
    }
}

// 데스크톱 레이아웃 복원 (모바일 폭 → 데스크톱 폭으로 되돌아올 때)
function restoreDesktopScroll() {
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('height');

    const fullpage = document.getElementById('fullpage');
    if (fullpage) {
        fullpage.style.removeProperty('height');
        fullpage.style.removeProperty('overflow');
    }

    // 섹션 인라인 높이 제거 + fp-section 클래스 복구
    document.querySelectorAll('.section').forEach(section => {
        section.style.removeProperty('height');
        section.style.removeProperty('min-height');
        section.classList.add('fp-section');
    });

    const fpNav = document.querySelector('.fp-nav');
    if (fpNav) {
        fpNav.style.removeProperty('display');
    }
}

// 전역 초기화 함수 (mapper에서 호출 가능)
let heroSliderInstance = null;
let gallerySliderInstance = null;

window.initHeroSlider = function() {
    if (heroSliderInstance) {
        heroSliderInstance.stop();
    }
    heroSliderInstance = new HeroSlider();
    heroSliderInstance.init();
};

window.initGallerySlider = function() {
    if (gallerySliderInstance) {
        gallerySliderInstance.stop();
    }
    gallerySliderInstance = new GallerySlider();
    gallerySliderInstance.init();
};

// DOM 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    // Hero Slider 초기화 (mapper 전에 실행될 수 있으므로 슬라이드 없으면 스킵)
    // mapper의 reinitializeSliders()에서 다시 호출됨
    window.initHeroSlider();

    // Gallery Slider 초기화 (모든 디바이스에서)
    window.initGallerySlider();

    // 모바일이 아닐 때만 Fullpage Scroll 초기화
    let fullpageScroll = null;
    if (window.innerWidth > 768) {
        fullpageScroll = new FullpageScroll();

        // 페이지 로드 완료 후 현재 섹션 애니메이션 체크 (더 빠르게)
        setTimeout(() => {
            fullpageScroll.checkAndTriggerCurrentSectionAnimation();
        }, 300);
    }

    // 스크롤 감지 초기화
    initScrollDetection();

    // 폭이 모바일/데스크톱 경계를 넘나들 때 레이아웃 전환
    // (기기 회전, 창 크기 변경, 개발자도구 디바이스 모드 — 새로고침 없이 전환됨)
    let isMobileLayout = window.innerWidth <= 768;
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const nowMobile = window.innerWidth <= 768;
            if (nowMobile === isMobileLayout) return;
            isMobileLayout = nowMobile;

            if (nowMobile) {
                // 풀페이지 스크롤 해제 → 일반 스크롤
                enableMobileScroll();
            } else {
                // 일반 스크롤 → 풀페이지 스크롤 복원
                restoreDesktopScroll();
                if (fullpageScroll) {
                    fullpageScroll.refresh();
                } else {
                    fullpageScroll = new FullpageScroll();
                }
            }
        }, 150);
    });

    // 모바일에서 일반 스크롤 활성화
    if (window.innerWidth <= 768) {
        enableMobileScroll();
        initMobileAnimations();
    } else {
        // 데스크톱에서 완전한 로드 후 애니메이션 활성화 (필요시에만)
        window.addEventListener('load', () => {
            if (fullpageScroll) {
                // 현재 스크롤 위치가 히어로 섹션이 아닌 경우에만 실행
                if (window.scrollY > window.innerHeight * 0.5) {
                    setTimeout(() => {
                        fullpageScroll.checkAndTriggerCurrentSectionAnimation();
                    }, 100);
                }
            }
        });
    }

    // 페이지 로드 시 텍스트 즉시 표시 설정
    setTimeout(() => {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        const sections = document.querySelectorAll('.fp-section');

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;

            // 현재 보이는 섹션인지 확인
            const isCurrentSection = scrollPosition >= sectionTop && scrollPosition <= sectionBottom;

            // 히어로 섹션이 아닌 경우 처리
            if (!section.classList.contains('hero-section')) {
                const elements = section.querySelectorAll('.animate-element');

                if (isCurrentSection) {
                    // 현재 보이는 섹션은 텍스트를 즉시 표시
                    elements.forEach(el => {
                        el.style.opacity = '1';
                        el.style.transform = 'translateY(0)';
                        el.classList.add('animate');
                    });
                } else {
                    // 다른 섹션들은 애니메이션 대기 상태로
                    elements.forEach(el => {
                        el.classList.remove('animate');
                        el.style.removeProperty('opacity');
                        el.style.removeProperty('transform');
                    });
                }
            }
        });
    }, 100);

    // Signature 썸네일 자동 및 클릭 이벤트
    const signatureThumbs = document.querySelectorAll('.signature-thumb');
    const signatureMainImage = document.getElementById('signature-main-image');
    let signatureCurrentIndex = 0;
    let signatureInterval = null;

    function changeSignatureImage(index) {
        // 모든 썸네일에서 active 클래스 제거
        signatureThumbs.forEach(t => t.classList.remove('active'));
        // 선택된 썸네일에 active 클래스 추가
        signatureThumbs[index].classList.add('active');

        // 메인 이미지 변경
        const newImageSrc = signatureThumbs[index].getAttribute('data-image');
        if (signatureMainImage && newImageSrc) {
            signatureMainImage.style.opacity = '0';
            setTimeout(() => {
                signatureMainImage.src = newImageSrc;
                signatureMainImage.style.opacity = '1';
            }, 250);
        }
    }

    // 자동 슬라이드 시작
    function startSignatureAutoSlide() {
        signatureInterval = setInterval(() => {
            signatureCurrentIndex = (signatureCurrentIndex + 1) % signatureThumbs.length;
            changeSignatureImage(signatureCurrentIndex);
        }, 4000); // 4초마다 변경
    }

    // 자동 슬라이드 중지
    function stopSignatureAutoSlide() {
        if (signatureInterval) {
            clearInterval(signatureInterval);
            signatureInterval = null;
        }
    }

    // 썸네일 클릭 이벤트
    signatureThumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', function() {
            stopSignatureAutoSlide(); // 자동 슬라이드 중지
            signatureCurrentIndex = index;
            changeSignatureImage(index);
            // 3초 후 자동 슬라이드 재시작
            setTimeout(startSignatureAutoSlide, 3000);
        });
    });

    // 자동 슬라이드 시작
    if (signatureThumbs.length > 0) {
        startSignatureAutoSlide();
    }
});