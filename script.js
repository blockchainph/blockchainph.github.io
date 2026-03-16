document.documentElement.classList.remove("no-js");
document.documentElement.classList.add("js");

const revealNodes = document.querySelectorAll("[data-reveal]");
const navLinks = document.querySelectorAll(".topnav a");
const sections = [...document.querySelectorAll("section[id]")];
const carousels = document.querySelectorAll("[data-carousel]");
const modalConfigs = [
  {
    modal: document.querySelector("[data-membership-modal]"),
    openButtons: document.querySelectorAll("[data-open-membership]"),
    closeButtons: document.querySelectorAll("[data-close-membership]"),
    form: document.querySelector("#membership-form"),
    success: document.querySelector("#membership-success"),
    statusNode: document.querySelector("#membership-form-status"),
    submitButton: document.querySelector("#membership-submit"),
    endpointNode: document.querySelector("#membership-form-endpoint"),
    fallbackNode: document.querySelector("#membership-contact-email"),
    defaultStatus:
      "Thank you for your interest in the Blockchain Practitioners Association of the Philippines (BPAP). We will review your submission and contact you once your membership is confirmed.",
    submitLabel: "Submit Application",
    submittingLabel: "Submitting...",
    errorMessage: "The form could not be submitted. Check the endpoint configuration and try again.",
    buildMailtoPayload(formData, recipient) {
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
  },
  {
    modal: document.querySelector("[data-contribution-modal]"),
    openButtons: document.querySelectorAll("[data-open-contribution]"),
    closeButtons: document.querySelectorAll("[data-close-contribution]"),
    form: document.querySelector("#contribution-form"),
    success: document.querySelector("#contribution-success"),
    statusNode: document.querySelector("#contribution-form-status"),
    submitButton: document.querySelector("#contribution-submit"),
    endpointNode: document.querySelector("#contribution-form-endpoint"),
    fallbackNode: document.querySelector("#contribution-contact-email"),
    defaultStatus:
      "Thank you for your interest in contributing to BPAP Insights. We will review your submission and contact you through the details you provided.",
    submitLabel: "Submit Contribution",
    submittingLabel: "Submitting...",
    errorMessage: "The contribution form could not be submitted. Check the endpoint configuration and try again.",
    buildMailtoPayload(formData, recipient) {
      const subject = encodeURIComponent("BPAP Insights contribution from " + formData.get("name"));
      const body = encodeURIComponent(
        [
          "Full Name: " + formData.get("name"),
          "Email Address: " + formData.get("email"),
          "Organization / Affiliation: " + (formData.get("organization") || "-"),
          "Current Role or Profession: " + (formData.get("role") || "-"),
          "Article Title: " + formData.get("title"),
          "Topic / Category: " + formData.get("topic"),
          "",
          "Short Abstract:",
          formData.get("abstract"),
          "",
          "Draft / Supporting Link: " + (formData.get("link") || "-"),
          "LinkedIn or Professional Profile: " + (formData.get("profile") || "-")
        ].join("\n")
      );

      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    }
  }
].filter(config => config.modal);

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

function setStatus(config, message) {
  if (config.statusNode) {
    config.statusNode.textContent = message;
  }
}

function setSubmittingState(config, isSubmitting) {
  if (!config.submitButton) {
    return;
  }

  config.submitButton.disabled = isSubmitting;
  config.submitButton.textContent = isSubmitting ? config.submittingLabel : config.submitLabel;
}

async function submitToEndpoint(endpoint, formData) {
  const response = await fetch(endpoint, {
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

function openModal(config) {
  if (!config.modal) {
    return;
  }

  if (config.form) {
    config.form.hidden = false;
  }

  if (config.success) {
    config.success.hidden = true;
  }

  config.modal.hidden = false;
  document.body.style.overflow = "hidden";
  setSubmittingState(config, false);
  setStatus(config, config.defaultStatus);
}

function closeModal(config) {
  if (!config.modal) {
    return;
  }

  config.modal.hidden = true;
  document.body.style.overflow = "";
}

modalConfigs.forEach(config => {
  config.openButtons.forEach(button => {
    button.addEventListener("click", () => openModal(config));
  });

  config.closeButtons.forEach(button => {
    button.addEventListener("click", () => closeModal(config));
  });

  config.modal.addEventListener("click", event => {
    if (event.target === config.modal) {
      closeModal(config);
    }
  });

  if (!config.form) {
    return;
  }

  config.form.addEventListener("submit", async event => {
    event.preventDefault();

    if (!config.form.reportValidity()) {
      setStatus(config, "Please complete the required fields before submitting.");
      return;
    }

    const formData = new FormData(config.form);
    const endpoint = config.endpointNode ? config.endpointNode.value.trim() : "";
    const fallbackRecipient = config.fallbackNode ? config.fallbackNode.value.trim() : "";
    setSubmittingState(config, true);
    setStatus(config, config.submittingLabel);

    try {
      if (endpoint) {
        await submitToEndpoint(endpoint, formData);
        config.form.reset();
        setStatus(config, config.defaultStatus);
        config.form.hidden = true;
        if (config.success) {
          config.success.hidden = false;
        }
        setSubmittingState(config, false);
        return;
      }

      config.buildMailtoPayload(formData, fallbackRecipient);
      setStatus(config, config.defaultStatus);
      config.form.hidden = true;
      if (config.success) {
        config.success.hidden = false;
      }
      setSubmittingState(config, false);
    } catch (error) {
      setStatus(config, config.errorMessage);
      setSubmittingState(config, false);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") {
    return;
  }

  modalConfigs.forEach(config => {
    if (config.modal && !config.modal.hidden) {
      closeModal(config);
    }
  });
});
