console.log("Based Vice Toads MiniApp loaded ✅");

const slides = document.querySelectorAll(".slide");
let current = 0;

setInterval(() => {
  slides[current].classList.remove("active");
  current = (current + 1) % slides.length;
  slides[current].classList.add("active");
}, 4000);

document.getElementById("mintBtn").addEventListener("click", () => {
  window.open("https://opensea.io/collection/vice-toads", "_blank");
});
