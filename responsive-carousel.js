/*jshint esversion: 6 */

(function() {
  'use strict';

  function Slideshow(element) {
    // The use of the this keyword inside the function specifies that
    // these properties will be unique to every instance of the User object.
    this.el = document.querySelector(element);
    this.init();
  }

  Slideshow.prototype = {
    init: function() {
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

      // Because the DOMContentLoaded event is fired without waiting
      // for stylesheets, images, and subframes to finish loading,
      // to get the rendered height of the slide, a "load" event listener
      // should be used for the setContainerHeight function
      // when the page is loaded at the first time.
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

      // Use an anonymous function to pass parameters
      // to the listener function:
      //
      //     element.addEventListener("click", function(){modifyText("four"); }, false);
      //
      // or use an arrow function:
      //
      //     element.addEventListener("click", () => { modifyText("four"); }, false);
      //
      // Note that while anonymous and arrow functions are similar,
      // they have different this bindings.
      // In anonymous functions, "this" will be out of context,
      // whereas arrow functions capture the this value of the
      // enclosing context, in other words, in arrow functions,
      // "this" retains the value of the enclosing lexical
      // context's this.
      // For example:
      //  a)
      //     $('.btn').click(function() {
      //       setTimeout(function() {
      //         $(this).text('new');
      //         // This will cause an error since function() defines this as the global object.
      //       }, 100);
      //     });
      //  b)
      //     $('.btn').click(function () { // <- Enclosing context
      //       setTimeout( () => {
      //         $(this).text('new');
      //         // This works, because this will be set to a value captured from the enclosing context.
      //       },100);
      //     });
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
    setContainerHeight: function(slideIndex) {
      // The Window.getComputedStyle() method returns an object that
      // reports the values of all CSS properties of an element after
      // applying active stylesheets and resolving any basic computation
      // those values may contain.
      //
      // var is scoped to the nearest function block and let is scoped to
      // the nearest enclosing block, which can be smaller than a function block.
      // Both are global if outside any block.
      let heightProp = window
        .getComputedStyle(this.slides[slideIndex])
        .getPropertyValue('height');
      this.el.style.height = heightProp;
      this.wrapper.style.height = heightProp;
    },

    sliderControlListener: function() {
      // let self = this;
      // Because of using arrow function, there is no need to
      // assign "this" value to the "self" to avoid the binding problem.
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

    paginationListener: function() {
      // In order to add event listener to each array element,
      // variable "i" must be declared within the for loop.
      //   for (let i = 0; i < this.total; i++) {
      //     this.pagination[i].addEventListener("click", () => {
      //       console.log(i);
      //     }, false);
      //   }
      // Use
      //   array.forEach(function(element_value, element_index) {...});
      // as an alternative method. Parameter element_value and
      // element_index store the information of each array element for the
      // forEach method.
      let self = this;
      self.pagination.forEach(function(pagination, index) {
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

    autoSlide: function() {
      this.autoSlideTimer = setInterval(() => {
        this.mode = 'next';
        this.setTargets(this.mode);
      }, 5000);
    },

    mouseOverListener: function() {
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

    touchListener: function() {
      // The evt.changedTouches value is stored in the evt
      // parameter within the addEventListener, it will be
      // lost or undefined when outside the addEventListener
      // and the function with the evt parameter. However,
      // when use "touchstart", "touchmove", "touchend",
      // their changedTouches values can be used by each other.
      //
      // Since calling preventDefault() on a touchstart or
      // the first touchmove event of a series prevents
      // the corresponding mouse events from firing, it's
      // common to call preventDefault() on touchmove
      // rather than touchstart.
      this.el.addEventListener(
        'touchstart',
        evt => {
          clearInterval(this.autoSlideTimer);
          this.autoSlideTimer = null;
          this.touchStart = evt.changedTouches[0].clientX;
        },
        false
      );
      this.el.addEventListener(
        'touchmove',
        evt => {
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

    touchActions: function() {
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

    setTargets: function(mode) {
      // prevents function from running while an animation is active
      if (this.running) {
        return false;
        // The return statement immediately stops execution of our
        // function and the code below will be never executed.
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

    paginationSetTargets: function(paginationIndex) {
      if (this.running) {
        return false;
      }
      this.running = true;
      this.newSlideIndex = paginationIndex;
      this.slideTo(this.currentSlideIndex, this.newSlideIndex);
    },

    slideTo: function(currentSlideIndex, newSlideIndex) {
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

    animate: function(slide) {
      // variable i is for counting
      let i = 0,
        self = this,
        animation = setInterval(() => {
          slide.style.left =
            this.mode === 'next'
              ? parseInt(slide.style.left) - 2 + '%'
              : parseInt(slide.style.left) + 2 + '%';
          i++;
          if (i >= 50) {
            stopAnimation();
          }
        }, 7);

      // In order to stop setInterval using clearInterval in a situation
      // like this, the function stopAnimation should be in the
      // same context as the setInterval, otherwise it should be declared
      // in global scope, like this.autoSlideTimer.
      function stopAnimation() {
        self.slides[self.currentSlideIndex].classList.remove('.active');
        // self.slides[self.newSlideIndex].style.left = "0%";
        clearInterval(animation);
        self.currentSlideIndex = self.newSlideIndex;
        self.running = false;
      }
    },

    slideControlDisplay: function() {
      // clientX/Y coordinates are relative to the top left corner of
      // the visible part of the page, "seen" through browser window.
      // pageX/Y coordinates are relative to the top left corner of
      // the whole rendered page (including parts hidden by scrolling).
      // If use "let mouseX = event.clientX;..." to output mouse coordinates,
      // the variable should be declared in the same scope.
      // For the example below, it should be declared within the arrow function.
      this.el.addEventListener(
        'mousemove',
        evt => {
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
    }
  };

  // The DOMContentLoaded event is fired when the initial HTML
  // document has been completely loaded and parsed, without waiting
  // for stylesheets, images, and subframes to finish loading.
  document.addEventListener('DOMContentLoaded', function() {
    let slider = new Slideshow('#mySlider');
  });
})();
