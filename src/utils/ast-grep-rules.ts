import type { NapiConfig } from '@ast-grep/napi';

export const astGrepRules = {
  // template
  CTX_MEMBER_EXPRESSION: {
    has: {
      pattern: '_ctx.$A',
    },
  },
  REF_DOM: {
    kind: 'string',
    inside: {
      kind: 'pair',
      inside: {
        kind: 'object',
        inside: {
          kind: 'arguments',
          regex: 'ref',
        },
      },
    },
  },
  RESOLVE_COMPONENT: {
    kind: 'string',
    inside: {
      kind: 'arguments',
      inside: {
        kind: 'call_expression',
        has: {
          kind: 'identifier',
          regex: '_resolveComponent',
        },
      },
    },
  },
};

export const getRules = (name: keyof typeof astGrepRules) => {
  return {
    rule: {
      matches: name,
    },
    utils: astGrepRules,
  };
};
