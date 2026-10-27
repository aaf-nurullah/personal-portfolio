'use strict';

const messageForm = document.querySelector('#message-form');

if (messageForm) {
    const nameField = document.querySelector('#message-name');
    const emailField = document.querySelector('#message-email');
    const messageField = document.querySelector('#message-text');
    const submitButton = messageForm.querySelector('button[type="submit"]');
    const status = document.querySelector('#message-status');
    const toast = document.querySelector('#message-toast');
    const toastText = document.querySelector('#message-toast-text');
    const toastIcon = document.querySelector('#message-toast-icon');
    const toastClose = document.querySelector('#message-toast-close');
    const fields = [nameField, emailField, messageField];
    const successMessage = 'Your message has been sent successfully! 🚀';
    const failureMessage = 'Failed to send message. Please try again later.';
    let sending = false;
    let toastTimer = 0;

    function hideToast() {
        clearTimeout(toastTimer);
        toast.hidden = true;
    }

    function scheduleToastDismissal() {
        clearTimeout(toastTimer);
        if (!toast.hidden && toast.dataset.state === 'success' && !toast.contains(document.activeElement)) {
            toastTimer = setTimeout(hideToast, 8000);
        }
    }

    function showToast(state, text) {
        toast.dataset.state = state;
        toastIcon.textContent = state === 'success' ? '✓' : '!';
        toastText.textContent = text;
        toast.hidden = false;
        status.textContent = text;
        scheduleToastDismissal();
    }

    function setSending(value) {
        sending = value;
        submitButton.disabled = value;
        submitButton.textContent = value ? 'Sending...' : 'Send Message';
        messageForm.setAttribute('aria-busy', String(value));
        for (const field of fields) field.disabled = value;
    }

    toastClose.addEventListener('click', hideToast);
    toast.addEventListener('pointerenter', () => clearTimeout(toastTimer));
    toast.addEventListener('pointerleave', scheduleToastDismissal);
    toast.addEventListener('focusin', () => clearTimeout(toastTimer));
    toast.addEventListener('focusout', event => {
        if (!toast.contains(event.relatedTarget)) scheduleToastDismissal();
    });
    messageForm.addEventListener('input', () => {
        for (const field of fields) field.setCustomValidity('');
    });

    messageForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (sending) return;

        const name = nameField.value.trim();
        const email = emailField.value.trim();
        const message = messageField.value.trim();
        nameField.setCustomValidity(name ? '' : 'Please enter your name.');
        messageField.setCustomValidity(message.length >= 10 ? '' : 'Please enter a message of at least 10 characters.');
        if (!messageForm.reportValidity()) return;

        hideToast();
        setSending(true);
        status.textContent = 'Sending your message…';
        const controller = new AbortController();
        const requestTimer = setTimeout(() => controller.abort(), 20000);

        try {
            const subject = `Portfolio message from ${name.replace(/[\r\n]/g, ' ')}`;
            const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    service_id: 'service_r5bhkwc',
                    template_id: 'template_duut0xd',
                    user_id: 'HwlJiQ8hK2w_3b-q4',
                    template_params: {
                        name,
                        email,
                        message,
                        from_name: name,
                        from_email: email,
                        user_name: name,
                        user_email: email,
                        reply_to: email,
                        to_name: 'Nurullah',
                        to_email: 'nurullahila173@gmail.com',
                        title: subject,
                        subject
                    }
                })
            });
            if (!response.ok) {
                const reason = (await response.text()).slice(0, 300);
                throw new Error(`EmailJS ${response.status}: ${reason}`);
            }
            messageForm.reset();
            showToast('success', successMessage);
        } catch (error) {
            console.error('EmailJS delivery failed:', error.message);
            showToast('error', failureMessage);
        } finally {
            clearTimeout(requestTimer);
            setSending(false);
        }
    });
}
