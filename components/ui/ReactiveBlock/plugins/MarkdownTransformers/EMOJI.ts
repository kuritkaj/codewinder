/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { TextMatchTransformer } from '@lexical/markdown';
import { $createTextNode } from "lexical";

import emojiList from '../../utils/emoji-list';

export const EMOJI: TextMatchTransformer = {
    dependencies: [],
    export: () => null,
    importRegExp: /:([a-z0-9_]+):/,
    regExp: /:([a-z0-9_]+):/,
    replace: (textNode, [, name]) => {
        const emoji = emojiList.find((e) => e.aliases.includes(name))?.emoji;
        if (emoji) {
            textNode.replace($createTextNode(emoji));
        }
    },
    trigger: ':',
    type: 'text-match',
};