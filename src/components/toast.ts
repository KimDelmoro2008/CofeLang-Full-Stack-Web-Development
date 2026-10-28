let timer: ReturnType<typeof setTimeout> | undefined;

/** Small status toast styled by the original CofeLang stylesheet. */
export function toast(message: string) {
  let el = document.getElementById("cl-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "cl-toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(timer);
  timer = setTimeout(() => el!.classList.remove("is-visible"), 2600);
}
