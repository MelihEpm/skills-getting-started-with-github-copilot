document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options on repeated fetches
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participants.length;

        // Build participants HTML (bulleted list or empty state) with delete buttons
        let participantsHtml = "";
        if (participants.length === 0) {
          participantsHtml = '<p class="participants-empty">No participants yet</p>';
        } else {
          participantsHtml = '<ul class="participants-list">';
          participants.forEach((p) => {
            participantsHtml += `<li class="participant-item"><span class="participant-name">${p}</span><button class="participant-remove" data-email="${p}" aria-label="Remove participant">✕</button></li>`;
          });
          participantsHtml += '</ul>';
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section"><strong>Participants</strong>${participantsHtml}</div>
        `;

        // expose activity name on the card for delegated handlers
        activityCard.dataset.activity = name;
        activitiesList.appendChild(activityCard);

        // Delegated handler for removing participants from this card
        activityCard.addEventListener('click', async (event) => {
          const btn = event.target.closest('.participant-remove');
          if (!btn) return;
          const email = btn.dataset.email;
          const activityName = activityCard.dataset.activity;
          if (!email || !activityName) return;
          const confirmed = window.confirm(`Remove ${email} from ${activityName}?`);
          if (!confirmed) return;
          try {
            const res = await fetch(`/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
            const json = await res.json().catch(() => ({}));
            if (res.ok) {
              messageDiv.textContent = json.message || 'Participant removed';
              messageDiv.className = 'message success';
              // refresh activities to reflect change
              await fetchActivities();
            } else {
              messageDiv.textContent = json.detail || 'Failed to remove participant';
              messageDiv.className = 'message error';
            }
          } catch (err) {
            console.error('Error removing participant:', err);
            messageDiv.textContent = 'Failed to remove participant';
            messageDiv.className = 'message error';
          }
          messageDiv.classList.remove('hidden');
          setTimeout(() => messageDiv.classList.add('hidden'), 5000);
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show updated participants and availability
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
