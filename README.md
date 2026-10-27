# Nurullah Ila – Portfolio Website 🌐

Welcome to my personal portfolio — a space for my interests in software development, Linux, networking, and cloud security.

Built with **HTML, CSS, and JavaScript**, the site brings together my introduction, skills, learning goals, and contact details in a responsive design.

---

## Features ✨

- Responsive layout for desktop, tablet, and mobile screens
- Midnight navy theme with mint and sage accents
- Interactive photographic hologram with particle effects
- Pointer, touch, and keyboard interaction with the portrait
- Animated greeting with a blinking cursor
- Skills organized into daily tools and a cloud/security learning roadmap
- EmailJS contact form with validation and a sending indicator
- Success and error notifications, with form clearing after successful submission
- Reduced-motion support, keyboard focus styles, and accessible status announcements
- Instagram, YouTube, LinkedIn, and GitHub links

---

## Sections 📑

- **About:** My background, interests, and focus on cloud security architecture
- **Projects:** A space for future projects, currently marked “coming soon :)”
- **Skills & Technologies:** Core Skills & Daily Tools, and Cloud & Security Roadmap
- **Leave a Message:** A contact form for sending a message through EmailJS

---

## Technologies 🛠️

- **HTML5** — page structure and semantic content
- **CSS3** — styling, responsive layouts, and visual effects
- **JavaScript & Canvas API** — particle animation and form interaction
- **EmailJS** — contact-form delivery
- **Font Awesome & Devicons** — social and technology icons

---

## How to Run 🚀

1. Clone the repository and enter the project folder:

   ```bash
   git clone https://github.com/aaf-nurullah/personal-portfolio.git
   cd personal-portfolio
   ```

2. Start a local HTTP server:

   ```bash
   python3 -m http.server 8000
   ```

3. Open [http://localhost:8000](http://localhost:8000) in your browser.

Serving the project over HTTP allows the JavaScript modules to load correctly. No build step or package installation is required to run the site.

---

## Contact Form ✉️

The form collects **Name**, **Email**, and **Message** and submits them through EmailJS without reloading the page.

While a message is being sent, the button displays `Sending...` and prevents repeated submissions. A successful response shows a confirmation and clears the fields. If sending fails, an error notification appears and the entered message is preserved.

EmailJS settings are configured in `message.js`. The service, template, recipient, and template variables must match the EmailJS account configuration. If domain restrictions are enabled, allow the origin serving the portfolio.

---

## Tests ✅

With Node.js installed, run:

```bash
node --test checks/*.test.mjs
```

The checks cover contact-form behavior and particle simulation. They use mocked responses and do not send real emails.

---

## License 📄

This project is licensed under the MIT License.
See the [LICENSE](LICENSE) file for more information.

---

## Contact 📧

Created by **Nurullah Ila** — feel free to get in touch through the website or social profiles.

- [Portfolio](https://aaf-nurullah.github.io/personal-portfolio/)