document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

const revealNodes = document.querySelectorAll("[data-reveal]");
const navLinks = document.querySelectorAll(".topnav a");
const sections = [...document.querySelectorAll("section[id]")];
const carousels = document.querySelectorAll("[data-carousel]");
const membershipModal = document.querySelector("[data-membership-modal]");
const openMembershipButtons = document.querySelectorAll("[data-open-membership]");
const closeMembershipButtons = document.querySelectorAll("[data-close-membership]");
const membershipForm = document.querySelector("#membership-form");
const membershipSuccess = document.querySelector("#membership-success");
const statusNode = document.querySelector("#form-status");
const endpointNode = document.querySelector("#form-endpoint");
const contactEmailNode = document.querySelector("#contact-email");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18
    }
  );

  revealNodes.forEach(node => revealObserver.observe(node));

  const sectionObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          return;
        }

        navLinks.forEach(link => {
          const matches = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", matches);
        });
      });
    },
    {
      rootMargin: "-40% 0px -45% 0px",
      threshold: 0
    }
  );

  sections.forEach(section => sectionObserver.observe(section));
} else {
  revealNodes.forEach(node => node.classList.add("is-visible"));
}

carousels.forEach(carousel => {
  const track = carousel.querySelector(".carousel-track");
  const slides = [...carousel.querySelectorAll(".carousel-slide")];
  const prevButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const dotsContainer = carousel.querySelector("[data-carousel-dots]");
  const statusNode = carousel.querySelector("[data-carousel-status]");

  if (!track || slides.length === 0 || !prevButton || !nextButton || !dotsContainer || !statusNode) {
    return;
  }

  let currentIndex = 0;

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Go to activity ${index + 1}`);
    dot.addEventListener("click", () => updateCarousel(index));
    dotsContainer.appendChild(dot);
    return dot;
  });

  function updateCarousel(index) {
    currentIndex = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    prevButton.disabled = index === 0;
    nextButton.disabled = index === slides.length - 1;
    statusNode.textContent = `${index + 1} / ${slides.length}`;

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === index);
      dot.setAttribute("aria-pressed", String(dotIndex === index));
    });
  }

  prevButton.addEventListener("click", () => {
    if (currentIndex > 0) {
      updateCarousel(currentIndex - 1);
    }
  });

  nextButton.addEventListener("click", () => {
    if (currentIndex < slides.length - 1) {
      updateCarousel(currentIndex + 1);
    }
  });

  updateCarousel(0);
});

function setStatus(message) {
  if (statusNode) {
    statusNode.textContent = message;
  }
}

function buildMailtoPayload(formData) {
  const recipient = contactEmailNode.value.trim();
  const subject = encodeURIComponent("BPAP membership application from " + formData.get("name"));
  const expertise = formData.getAll("expertise").join(", ") || "-";
  const contribution = formData.getAll("contribution").join(", ") || "-";
  const body = encodeURIComponent(
    [
      "Full Name: " + formData.get("name"),
      "Email Address: " + formData.get("email"),
      "Mobile Number: " + (formData.get("mobile") || "-"),
      "City / Province: " + (formData.get("location") || "-"),
      "Organization / Company: " + (formData.get("organization") || "-"),
      "Current Role or Profession: " + (formData.get("role") || "-"),
      "Area of Expertise in Blockchain: " + expertise,
      "",
      "Brief description of blockchain experience:",
      formData.get("experience"),
      "",
      "How would you like to contribute to BPAP?: " + contribution,
      "LinkedIn or Professional Profile: " + (formData.get("profile") || "-")
    ].join("\n")
  );

  window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
}

async function submitToEndpoint(formData) {
  const response = await fetch(endpointNode.value.trim(), {
    method: "POST",
    headers: {
      Accept: "application/json"
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error("Submission failed");
  }

  const payload = await response.json().catch(() => ({}));

  if (payload.success === "false" || payload.success === false) {
    throw new Error("Submission failed");
  }
}

function openMembershipModal() {
  if (!membershipModal) {
    return;
  }

  if (membershipForm) {
    membershipForm.hidden = false;
  }

  if (membershipSuccess) {
    membershipSuccess.hidden = true;
  }

  membershipModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeMembershipModal() {
  if (!membershipModal) {
    return;
  }

  membershipModal.hidden = true;
  document.body.style.overflow = "";
}

openMembershipButtons.forEach(button => {
  button.addEventListener("click", openMembershipModal);
});

closeMembershipButtons.forEach(button => {
  button.addEventListener("click", closeMembershipModal);
});

if (membershipModal) {
  membershipModal.addEventListener("click", event => {
    if (event.target === membershipModal) {
      closeMembershipModal();
    }
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && membershipModal && !membershipModal.hidden) {
    closeMembershipModal();
  }
});

if (membershipForm) {
  membershipForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!membershipForm.reportValidity()) {
      setStatus("Please complete the required fields before submitting.");
      return;
    }

    const formData = new FormData(membershipForm);
    const endpoint = endpointNode.value.trim();

    try {
      if (endpoint) {
        await submitToEndpoint(formData);
        membershipForm.reset();
        setStatus(
          "Thank you for your interest in the Blockchain Practitioners Association of the Philippines (BPAP). We will review your submission and contact you once your membership is confirmed."
        );
        membershipForm.hidden = true;
        if (membershipSuccess) {
          membershipSuccess.hidden = false;
        }
        return;
      }

      buildMailtoPayload(formData);
      setStatus(
        "Thank you for your interest in the Blockchain Practitioners Association of the Philippines (BPAP). We will review your submission and contact you once your membership is confirmed."
      );
      membershipForm.hidden = true;
      if (membershipSuccess) {
        membershipSuccess.hidden = false;
      }
    } catch (error) {
      setStatus("The form could not be submitted. Check the endpoint configuration and try again.");
    }
  });
}
