import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../message.js', import.meta.url), 'utf8');
const SUCCESS = 'Your message has been sent successfully! 🚀';
const FAILURE = 'Failed to send message. Please try again later.';

class Element {
    value = '';
    disabled = false;
    hidden = true;
    textContent = '';
    dataset = {};
    attributes = new Map();
    listeners = new Map();
    validity = '';
    addEventListener(type, listener) {
        this.listeners.set(type, [...(this.listeners.get(type) || []), listener]);
    }
    setAttribute(name, value) { this.attributes.set(name, value); }
    setCustomValidity(value) { this.validity = value; }
    contains(element) { return element === this; }
    emit(type, event = {}) {
        return Promise.all((this.listeners.get(type) || []).map(listener => listener(event)));
    }
}

function setup(send, valid = true) {
    const elements = Object.fromEntries([
        'message-form', 'message-name', 'message-email', 'message-text', 'message-status',
        'message-toast', 'message-toast-text', 'message-toast-icon', 'message-toast-close', 'submit'
    ].map(id => [id, new Element()]));
    const form = elements['message-form'];
    const button = elements.submit;
    button.textContent = 'Send Message';
    const fields = ['message-name', 'message-email', 'message-text'].map(id => elements[id]);
    [fields[0].value, fields[1].value, fields[2].value] = [
        '  Test Sender  ', 'sender@example.com', '  A test message for the portfolio.  '
    ];
    let resetCount = 0;
    form.querySelector = selector => selector === 'button[type="submit"]' ? button : null;
    form.reportValidity = () => valid && fields.every(field => !field.validity);
    form.reset = () => { resetCount++; for (const field of fields) field.value = ''; };
    const document = { querySelector: selector => elements[selector.slice(1)], activeElement: null };
    const timers = new Map();
    let timerId = 0;
    const calls = [];
    const errors = [];
    vm.runInNewContext(source, {
        document,
        fetch: (...args) => { calls.push(args); return send(...args); },
        AbortController,
        setTimeout: (callback, delay) => { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
        clearTimeout: id => timers.delete(id),
        console: { error: (...args) => errors.push(args) }
    });
    return {
        elements, fields, form, button, calls, timers, errors, document,
        get resetCount() { return resetCount; },
        submit() {
            const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
            const complete = form.emit('submit', event);
            return { event, complete };
        },
        fireTimer(delay) {
            const item = [...timers].find(([, timer]) => timer.delay === delay);
            assert.ok(item, `A ${delay}ms timer should exist`);
            timers.delete(item[0]);
            item[1].callback();
        }
    };
}

test('prevents navigation, submits the supplied EmailJS configuration once, and resets only after success', async () => {
    let finish;
    const ctx = setup(() => new Promise(resolve => { finish = resolve; }));
    const first = ctx.submit();
    assert.equal(first.event.defaultPrevented, true);
    assert.equal(ctx.button.textContent, 'Sending...');
    assert.equal(ctx.button.disabled, true);
    assert.ok(ctx.fields.every(field => field.disabled));
    assert.equal(ctx.form.attributes.get('aria-busy'), 'true');
    assert.equal(ctx.resetCount, 0);
    const duplicate = ctx.submit();
    await duplicate.complete;
    assert.equal(ctx.calls.length, 1);
    const [url, options] = ctx.calls[0];
    assert.equal(url, 'https://api.emailjs.com/api/v1.0/email/send');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    const body = JSON.parse(options.body);
    assert.equal(body.service_id, 'service_r5bhkwc');
    assert.equal(body.template_id, 'template_duut0xd');
    assert.equal(body.user_id, 'HwlJiQ8hK2w_3b-q4');
    assert.equal(body.template_params.name, 'Test Sender');
    assert.equal(body.template_params.reply_to, 'sender@example.com');
    assert.equal(body.template_params.message, 'A test message for the portfolio.');
    finish({ ok: true, status: 200 });
    await first.complete;
    assert.equal(ctx.resetCount, 1);
    assert.ok(ctx.fields.every(field => field.value === '' && !field.disabled));
    assert.equal(ctx.button.disabled, false);
    assert.equal(ctx.button.textContent, 'Send Message');
    assert.equal(ctx.form.attributes.get('aria-busy'), 'false');
    assert.equal(ctx.elements['message-toast'].hidden, false);
    assert.equal(ctx.elements['message-toast'].dataset.state, 'success');
    assert.equal(ctx.elements['message-toast-text'].textContent, SUCCESS);
    assert.equal(ctx.elements['message-status'].textContent, SUCCESS);
    assert.ok(![...ctx.timers.values()].some(timer => timer.delay === 20000));
});

test('API failure preserves all inputs, shows the exact error, and restores the send button', async () => {
    const ctx = setup(async () => ({ ok: false, status: 422, text: async () => 'Template rejected' }));
    const original = ctx.fields.map(field => field.value);
    await ctx.submit().complete;
    assert.deepEqual(ctx.fields.map(field => field.value), original);
    assert.equal(ctx.resetCount, 0);
    assert.equal(ctx.elements['message-toast-text'].textContent, FAILURE);
    assert.equal(ctx.elements['message-toast'].dataset.state, 'error');
    assert.equal(ctx.button.textContent, 'Send Message');
    assert.equal(ctx.button.disabled, false);
    assert.ok(ctx.fields.every(field => !field.disabled));
    assert.equal(ctx.timers.size, 0, 'Errors remain visible until dismissed');
});

test('network rejection preserves the draft and never reports success', async () => {
    const ctx = setup(async () => { throw new Error('Network unavailable'); });
    await ctx.submit().complete;
    assert.equal(ctx.resetCount, 0);
    assert.equal(ctx.elements['message-status'].textContent, FAILURE);
    assert.equal(ctx.button.disabled, false);
    assert.notEqual(ctx.fields[2].value, '');
});

test('a stalled request times out and releases the form without clearing it', async () => {
    const ctx = setup((_, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Timed out')));
    }));
    const send = ctx.submit();
    ctx.fireTimer(20000);
    await send.complete;
    assert.equal(ctx.elements['message-toast-text'].textContent, FAILURE);
    assert.equal(ctx.button.textContent, 'Send Message');
    assert.equal(ctx.button.disabled, false);
    assert.equal(ctx.resetCount, 0);
});

test('native validation and whitespace-only values prevent any API call', async () => {
    const invalid = setup(async () => { throw new Error('Should not send'); }, false);
    const submit = invalid.submit();
    await submit.complete;
    assert.equal(submit.event.defaultPrevented, true);
    assert.equal(invalid.calls.length, 0);
    const whitespace = setup(async () => { throw new Error('Should not send'); });
    whitespace.fields[0].value = '  ';
    await whitespace.submit().complete;
    assert.equal(whitespace.calls.length, 0);
    assert.equal(whitespace.fields[0].validity, 'Please enter your name.');
    await whitespace.form.emit('input');
    assert.equal(whitespace.fields[0].validity, '');
});

test('success notifications can be paused, auto-dismissed, and manually dismissed', async () => {
    const ctx = setup(async () => ({ ok: true, status: 200 }));
    await ctx.submit().complete;
    await ctx.elements['message-toast'].emit('pointerenter');
    assert.equal(ctx.timers.size, 0);
    await ctx.elements['message-toast'].emit('pointerleave');
    ctx.fireTimer(8000);
    assert.equal(ctx.elements['message-toast'].hidden, true);
    ctx.fields[0].value = 'Test Sender';
    ctx.fields[1].value = 'sender@example.com';
    ctx.fields[2].value = 'Another test message.';
    await ctx.submit().complete;
    await ctx.elements['message-toast-close'].emit('click');
    assert.equal(ctx.elements['message-toast'].hidden, true);
    assert.equal(ctx.timers.size, 0);
});
