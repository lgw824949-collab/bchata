const POSTCODE_SCRIPT = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

let loadPromise = null;

export function loadDaumPostcode() {
  if (typeof window !== 'undefined' && window.daum?.Postcode) {
    return Promise.resolve(window.daum.Postcode);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = POSTCODE_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.daum?.Postcode) {
        resolve(window.daum.Postcode);
        return;
      }
      loadPromise = null;
      reject(new Error('Daum Postcode failed to load'));
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Daum Postcode script error'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
