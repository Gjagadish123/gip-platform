/** sessionStorage key: the logo loader has played in this session. */
export const INTRO_SEEN = "gip-intro";

// Runs while the HTML is parsed, right after the loader: repeat visits in a session and reduced motion never see the
// loader; with script the no-JS fallback fade is cancelled (data-js) and a timer guarantees the page opens even if
// hydration never comes (the loader clears it once its own timeline starts).
const BOOT = `(function(){var e=document.getElementById("intro");if(!e)return;try{if(sessionStorage.getItem("${INTRO_SEEN}")||matchMedia("(prefers-reduced-motion: reduce)").matches){e.hidden=true;return}}catch(_){}e.setAttribute("data-js","");window.__gipIntro=setTimeout(function(){e.setAttribute("data-out","");e.hidden=true;document.documentElement.removeAttribute("data-intro")},8000)})();`;

/** The loader's boot script, a server component so React never renders the <script> on the client. */
export function IntroBoot() {
  return <script dangerouslySetInnerHTML={{ __html: BOOT }} />;
}
