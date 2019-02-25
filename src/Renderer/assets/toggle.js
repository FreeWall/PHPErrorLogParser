/**
 * This file is part of the Tracy (https://tracy.nette.org)
 */

'use strict';

(function() {

	// enables <a class="tracy-toggle" href="#"> or <span data-tracy-ref="#"> toggling
	class Toggle
	{
		static init() {
			document.documentElement.addEventListener('click', (e) => {
				let el = e.target.closest('.tracy-toggle');
				if (el && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
					Toggle.toggle(el);
				}
			});
			Toggle.init = function() {};

			// enables <span data-tracy-href=""> & ctrl key
			document.documentElement.addEventListener('click', (e) => {
				let el;
				if (e.ctrlKey && (el = e.target.closest('[data-tracy-href]'))) {
					location.href = el.getAttribute('data-tracy-href');
					return false;
				}
			});
		}


		// changes element visibility
		static toggle(el, show) {
			let collapsed = el.classList.contains('tracy-collapsed'),
				ref = el.getAttribute('data-tracy-ref') || el.getAttribute('href', 2),
				dest = el;

			if (typeof show === 'undefined') {
				show = collapsed;
			} else if (!show === collapsed) {
				return;
			}

			if (!ref || ref === '#') {
				ref = '+';
			} else if (ref.substr(0, 1) === '#') {
				dest = document;
			}
			ref = ref.match(/(\^\s*([^+\s]*)\s*)?(\+\s*(\S*)\s*)?(.*)/);
			dest = ref[1] ? dest.parentNode : dest;
			dest = ref[2] ? dest.closest(ref[2]) : dest;
			dest = ref[3] ? Toggle.nextElement(dest.nextElementSibling, ref[4]) : dest;
			dest = ref[5] ? dest.querySelector(ref[5]) : dest;

			el.classList.toggle('tracy-collapsed', !show);
			dest.classList.toggle('tracy-collapsed', !show);

			el.dispatchEvent(new CustomEvent('tracy-toggle', {
				bubbles: true,
				detail: {relatedTarget: dest, collapsed: !show}
			}));
		}


		// save & restore toggles
		static persist(baseEl, restore) {
			let saved = [];
			baseEl.addEventListener('tracy-toggle', (e) => {
				if (saved.indexOf(e.target) < 0) {
					saved.push(e.target);
				}
			});

			let toggles = JSON.parse(sessionStorage.getItem('tracy-toggles-' + baseEl.id));
			if (toggles && restore !== false) {
				toggles.forEach((item) => {
					let el = baseEl;
					for (let i in item.path) {
						if (!(el = el.children[item.path[i]])) {
							return;
						}
					}
					if (el.textContent === item.text) {
						Toggle.toggle(el, item.show);
					}
				});
			}

			window.addEventListener('unload', () => {
				toggles = saved.map((el) => {
					let item = {path: [], text: el.textContent, show: !el.classList.contains('tracy-collapsed')};
					do {
						item.path.unshift(Array.from(el.parentNode.children).indexOf(el));
						el = el.parentNode;
					} while (el && el !== baseEl);
					return item;
				});
				sessionStorage.setItem('tracy-toggles-' + baseEl.id, JSON.stringify(toggles));
			});
		}


		// finds next matching element
		static nextElement(el, selector) {
			while (el && selector && !el.matches(selector)) {
				el = el.nextElementSibling;
			}
			return el;
		}
	}

	Tracy.Toggle = Toggle;
})();