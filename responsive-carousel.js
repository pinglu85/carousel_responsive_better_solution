/*jshint esversion: 6 */

(function () {
  'use strict';

  function Slideshow(element) {
    this.el = document.querySelector(element);
    this.init();
  }

  Slideshow.prototype = {
    init: function () {
      this.wrapper = this.el.querySelector('.slider-wrapper');
      this.slides = this.el.querySelectorAll('.item');
      this.total = this.slides.length;
      this.prev = this.el.querySelector('.prev');
      this.next = this.el.querySelector('.next');
      this.pagination = this.el.querySelectorAll('.pagination');
      this.containerWidth = window
        .getComputedStyle(this.el)
        .getPropertyValue('width');
      this.containerWidthValue = parseInt(this.containerWidth);
      this.containerOffsetLeft = this.el.offsetLeft;
      this.running = false;
      this.mode = null;
      this.currentSlideIndex = 0;
      this.newSlideIndex = null;
      this.newPaginationIndex = null;
      this.touchStart = null;
      this.touchMove = null;
      this.touchDistance = null;
      this.autoSlideTimer = null;

      window.addEventListener('load', () => {
        this.setContainerHeight(this.currentSlideIndex);
      });
      if (window.matchMedia('(min-width: 992px)').matches) {
        this.sliderControlListener();
        this.paginationListener();
        this.slideControlDisplay();
      }
      if (window.matchMedia('(max-width: 991px)').matches) {
        this.touchListener();
      }
      this.mouseOverListener();
      this.autoSlide();

      window.addEventListener(
        'resize',
        () => {
          //sets the slide container height when the browser window is resized.
          this.setContainerHeight(this.currentSlideIndex);
          // recalculate the width of the container
          this.containerWidth = window
            .getComputedStyle(this.el)
            .getPropertyValue('width');
          this.containerWidthValue = parseInt(this.containerWidth);
          this.containerOffsetLeft = this.el.offsetLeft;
          if (window.matchMedia('(max-width: 991px)').matches) {
            this.touchListener();
          }
        },
        true
      );
    },

    //sets the container height to the height of slides. Height is not defined in css.
    setContainerHeight: function (slideIndex) {
      let heightProp = window
        .getComputedStyle(this.slides[slideIndex])
        .getPropertyValue('height');
      this.el.style.height = heightProp;
      this.wrapper.style.height = heightProp;
    },

    sliderControlListener: function () {
      this.next.addEventListener(
        'click',
        () => {
          this.mode = 'next';
          this.setTargets(this.mode);
        },
        false
      );

      this.prev.addEventListener(
        'click',
        () => {
          this.mode = 'prev';
          this.setTargets(this.mode);
        },
        false
      );
    },

    paginationListener: function () {
      let self = this;
      self.pagination.forEach(function (pagination, index) {
        pagination.addEventListener(
          'click',
          () => {
            self.newPaginationIndex = index;
            if (self.newPaginationIndex > self.currentSlideIndex) {
              self.mode = 'next';
            } else if (self.newPaginationIndex < self.currentSlideIndex) {
              self.mode = 'prev';
            } else if ((self.newPaginationIndex = self.currentSlideIndex)) {
              return false;
            }
            self.paginationSetTargets(self.newPaginationIndex);
          },
          false
        );
      });
    },

    autoSlide: function () {
      this.autoSlideTimer = setInterval(() => {
        this.mode = 'next';
        this.setTargets(this.mode);
      }, 5000);
    },

    mouseOverListener: function () {
      // stops auto slide mode on hover
      this.el.addEventListener(
        'mouseover',
        () => {
          clearInterval(this.autoSlideTimer);
          this.autoSlideTimer = null;
        },
        false
      );
      // restarts auto slide when mouse out
      this.el.addEventListener(
        'mouseout',
        () => {
          this.autoSlide();
        },
        false
      );
    },

    touchListener: function () {
      this.el.addEventListener(
        'touchstart',
        (evt) => {
          clearInterval(this.autoSlideTimer);
          this.autoSlideTimer = null;
          this.touchStart = evt.changedTouches[0].clientX;
        },
        false
      );
      this.el.addEventListener(
        'touchmove',
        (evt) => {
          evt.preventDefault();
          this.touchMove = evt.changedTouches[0].clientX;
          this.touchActions();
        },
        false
      );
      this.el.addEventListener(
        'touchend',
        () => {
          this.autoSlide();
        },
        false
      );
    },

    touchActions: function () {
      this.touchDistance =
        this.touchMove - this.touchStart - this.containerOffsetLeft;
      if (
        this.touchDistance < 0 &&
        this.touchDistance <= -this.containerWidthValue / 2
      ) {
        this.mode = 'next';
        this.setTargets(this.mode);
      } else if (
        this.touchDistance > 0 &&
        this.touchDistance >= this.containerWidthValue / 2
      ) {
        this.mode = 'prev';
        this.setTargets(this.mode);
      }
    },

    setTargets: function (mode) {
      // prevents function from running while an animation is active
      if (this.running) {
        return false;
      }

      this.running = true;
      this.mode = mode;

      if (this.mode === 'next') {
        this.newSlideIndex = this.currentSlideIndex + 1;
        // resets the slide pointer to 0 so the slideshow can loop back
        if (this.newSlideIndex === this.total) {
          this.newSlideIndex = 0;
        }
      } else {
        this.newSlideIndex = this.currentSlideIndex - 1;
        // resets the slide pointer to the last slide so the slideshow can loop back
        if (this.newSlideIndex < 0) {
          this.newSlideIndex = this.total - 1;
        }
      }

      this.slideTo(this.currentSlideIndex, this.newSlideIndex);
    },

    paginationSetTargets: function (paginationIndex) {
      if (this.running) {
        return false;
      }
      this.running = true;
      this.newSlideIndex = paginationIndex;
      this.slideTo(this.currentSlideIndex, this.newSlideIndex);
    },

    slideTo: function (currentSlideIndex, newSlideIndex) {
      this.pagination[currentSlideIndex].classList.remove('active');
      this.pagination[newSlideIndex].classList.add('active');

      // set slides position for animation.
      // left: %: sets the left edge position in % of
      // containing element(its nearest block-level ancestor).
      this.slides[currentSlideIndex].style.left = '0%';
      this.slides[newSlideIndex].style.left =
        this.mode === 'next' ? '100%' : '-100%';

      this.slides[newSlideIndex].classList.add('active');

      // sets the container height to the height of the new slide
      this.setContainerHeight(this.newSlideIndex);

      // begins both animation
      this.animate(this.slides[newSlideIndex]);
      this.animate(this.slides[currentSlideIndex]);
    },

    animate: function (slide) {
      // variable i is for counting
      let i = 0;
      let self = this;
      let animation = setInterval(() => {
        slide.style.left =
          this.mode === 'next'
            ? parseInt(slide.style.left) - 2 + '%'
            : parseInt(slide.style.left) + 2 + '%';
        i++;
        if (i >= 50) {
          stopAnimation();
        }
      }, 7);

      function stopAnimation() {
        self.slides[self.currentSlideIndex].classList.remove('.active');
        // self.slides[self.newSlideIndex].style.left = "0%";
        clearInterval(animation);
        self.currentSlideIndex = self.newSlideIndex;
        self.running = false;
      }
    },

    slideControlDisplay: function () {
      // clientX/Y coordinates are relative to the top left corner of
      // the visible part of the page, "seen" through browser window.
      // pageX/Y coordinates are relative to the top left corner of
      // the whole rendered page (including parts hidden by scrolling).
      this.el.addEventListener(
        'mousemove',
        (evt) => {
          if (
            evt.clientX - this.containerOffsetLeft <
            this.containerWidthValue / 2
          ) {
            console.log(this.containerWidthValue);
            this.prev.style.display = 'block';
            this.next.style.display = 'none';
          } else if (
            evt.clientX - this.containerOffsetLeft >
            this.containerWidthValue / 2
          ) {
            this.next.style.display = 'block';
            this.prev.style.display = 'none';
          }
        },
        false
      );
      this.el.addEventListener(
        'mouseout',
        () => {
          this.prev.style.display = 'none';
          this.next.style.display = 'none';
        },
        false
      );
    },
  };

  document.addEventListener('DOMContentLoaded', function () {
    let slider = new Slideshow('#mySlider');
  });
})();
