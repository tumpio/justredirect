/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createRequestFilters } from "../main/api.js";
import { CompositeRule, RequestController } from "../main/control.js";
import { BlockRule } from "../main/rules/block.js";
import { FilterRule } from "../main/rules/filter.js";
import { RedirectRule } from "../main/rules/redirect.js";
import { SecureRule } from "../main/rules/secure.js";
import { LoggedWhitelistRule, WhitelistRule } from "../main/rules/whitelist.js";
import { matchPatternToRegExp } from "../util/regexp.js";
import ModalDialog from "./modal-dialog.js";

let previousTestUrl;

class RuleTestDialog extends ModalDialog {
    constructor() {
        super();
        this.rules = [];
        const template = document.getElementById("rule-test-dialog");
        this.shadowRoot.getElementById("content").append(template.content.cloneNode(true));

        this.shadowRoot.getElementById("test-url").addEventListener("input", (e) => {
            const result = this.shadowRoot.getElementById("result");
            result.textContent = testRules(e.target.value, this.rules);
        });
    }

    connectedCallback() {
        super.connectedCallback();
        this.shadowRoot.getElementById("title").textContent = browser.i18n.getMessage("test_selected_rules");

        const input = this.shadowRoot.getElementById("test-url");

        if (previousTestUrl) {
            input.value = previousTestUrl;
            const result = this.shadowRoot.getElementById("result");
            result.textContent = testRules(previousTestUrl, this.rules);
        }
        input.focus();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        previousTestUrl = this.shadowRoot.getElementById("test-url").value;
    }
}

customElements.define("rule-test-dialog", RuleTestDialog);

export function showRuleTestDialog(rules) {
    const dialog = document.createElement("rule-test-dialog");
    dialog.rules = rules;
    document.body.append(dialog);
}

function testRules(testUrl, rulePatterns) {
    try {
        new URL(testUrl);
    } catch {
        return browser.i18n.getMessage("invalid_test_url");
    }
    const controller = new RequestController();
    const request = { requestId: 0, url: testUrl };

    try {
        for (const rulePattern of rulePatterns) {
            const filters = createRequestFilters(rulePattern);
            for (const { rule, urls, matcher } of filters) {
                if (
                    urls.map(matchPatternToRegExp).some((pattern) => pattern.test(request.url)) &&
                    matcher.test(request)
                ) {
                    controller.mark(request, rule);
                    break;
                }
            }
        }
    } catch {
        return browser.i18n.getMessage("error_invalid_rule");
    }
    const rule = controller.requests.get(request.requestId);

    if (!rule) {
        return browser.i18n.getMessage("no_match");
    }
    return testRule(rule, testUrl);
}

function testRule(rule, testUrl) {
    let redirectUrl;
    switch (rule.constructor) {
        case WhitelistRule:
        case LoggedWhitelistRule:
            return browser.i18n.getMessage("whitelisted");
        case BlockRule:
            return browser.i18n.getMessage("blocked");
        case RedirectRule:
        case FilterRule:
            redirectUrl = rule.apply(testUrl);
            try {
                new URL(redirectUrl);
            } catch {
                return browser.i18n.getMessage("invalid_target_url", redirectUrl);
            }
            if (redirectUrl === testUrl) {
                return browser.i18n.getMessage("matched_no_change");
            }
            return redirectUrl;
        case CompositeRule:
            redirectUrl = rule.rules.reduce((url, r) => {
                const change = r.apply(url);
                if (change !== null) {
                    return change;
                }
                return url;
            }, testUrl);
            try {
                new URL(redirectUrl);
            } catch {
                return browser.i18n.getMessage("invalid_target_url", redirectUrl);
            }
            if (redirectUrl === testUrl) {
                return browser.i18n.getMessage("matched_no_change");
            }
            return redirectUrl;
        case SecureRule:
            return browser.i18n.getMessage("upgraded_to_secure");
        default:
            break;
    }
}
