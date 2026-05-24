/**
 * Apple-style sticky "Compare" pill per work-item section.
 * Reveals on scroll with a simple fade; sticks to viewport bottom within each .work-item.
 */
(function () {
  var workItems = document.querySelectorAll('.work-item[data-color]');

  workItems.forEach(function (item) {
    var aap = item.querySelector('.work-item-aap');
    if (!aap) {
      return;
    }

    var revealRatio = 0.42;
    var hideRatio = 0.2;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var ratio = entry.intersectionRatio;

          if (entry.isIntersecting && ratio >= revealRatio) {
            aap.classList.add('is-in-view');
            aap.setAttribute('aria-hidden', 'false');
          } else if (!entry.isIntersecting || ratio <= hideRatio) {
            aap.classList.remove('is-in-view');
            aap.setAttribute('aria-hidden', 'true');
          }
        });
      },
      {
        threshold: [0, 0.2, 0.42, 0.55],
        rootMargin: '0px 0px -28% 0px'
      }
    );

    observer.observe(item);
  });
})();
