/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
    BLOCK_ACTION,
    DISABLED_STATE,
    FILTER_ACTION,
    NO_ACTION,
    REDIRECT_ACTION,
    WHITELIST_ACTION
} from "./RequestControl/base.js";

export const REQUEST_CONTROL_ICONS = {};
REQUEST_CONTROL_ICONS[WHITELIST_ACTION] = {
    19: "/icons/icon-whitelist@19.png",
    38: "/icons/icon-whitelist@38.png"
};
REQUEST_CONTROL_ICONS[BLOCK_ACTION] = {
    19: "/icons/icon-block@19.png",
    38: "/icons/icon-block@38.png"
};
REQUEST_CONTROL_ICONS[FILTER_ACTION] = {
    19: "/icons/icon-filter@19.png",
    38: "/icons/icon-filter@38.png"
};
REQUEST_CONTROL_ICONS[REDIRECT_ACTION] = {
    19: "/icons/icon-redirect@19.png",
    38: "/icons/icon-redirect@38.png"
};
REQUEST_CONTROL_ICONS[NO_ACTION] = {
    19: "/icons/icon-blank@19.png",
    38: "/icons/icon-blank@38.png"
};
REQUEST_CONTROL_ICONS[DISABLED_STATE] = {
    19: "/icons/icon-disabled@19.png",
    38: "/icons/icon-disabled@38.png"
};
REQUEST_CONTROL_ICONS[FILTER_ACTION | REDIRECT_ACTION] = REQUEST_CONTROL_ICONS[FILTER_ACTION];


class TitleNotifier {
    static notify(tabId, action, recordsCount) {
        updateTitle(tabId, recordsCount.toString());
    }

    static error(tabId, action, error) {
        updateTitle(tabId, error);
    }

    static clear(tabId) {
        updateTitle(tabId, "");
    }

    static disabledState(records) {
        updateTitle(null, "Disabled");
        for (let [tabId,] of records) {
            updateTitle(tabId, "");
        }
    }

    static enabledState() {
        updateTitle(null, "");
    }
}

class BadgeNotifier extends TitleNotifier {
    static notify(tabId, action, recordsCount) {
        super.notify(tabId, action, recordsCount);
        updateBadge(tabId, REQUEST_CONTROL_ICONS[action], recordsCount.toString());
    }

    static error(tabId, action, error) {
        super.error(tabId, action, error);
        updateBadge(tabId, REQUEST_CONTROL_ICONS[action], String.fromCodePoint(10071));
    }

    static clear(tabId) {
        super.clear(tabId);
        updateBadge(tabId, REQUEST_CONTROL_ICONS[NO_ACTION], "");
    }

    static disabledState(records) {
        super.disabledState(records);
        updateBadge(null, REQUEST_CONTROL_ICONS[DISABLED_STATE], "");
        for (let [tabId,] of records) {
            updateBadge(tabId, null, "");
        }
    }

    static enabledState() {
        super.enabledState();
        updateBadge(null, REQUEST_CONTROL_ICONS[NO_ACTION], "");
    }
}

export function getNotifier(browserInfo) {
    if (browserInfo.name === "Fennec") {
        return TitleNotifier;
    } else {
        return BadgeNotifier;
    }
}

function updateBadge(tabId, icon, text) {
    browser.browserAction.setBadgeText({
        tabId: tabId,
        text: text
    });
    browser.browserAction.setIcon({
        tabId: tabId,
        path: icon
    });
}

function updateTitle(tabId, state) {
    let title;
    if (state) {
        title = browser.i18n.getMessage("main_title_with_state", state);
    } else {
        title = browser.i18n.getMessage("extensionName");
    }
    browser.browserAction.setTitle({
        tabId: tabId,
        title: title
    });
}
