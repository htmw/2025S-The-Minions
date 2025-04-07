module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: ['airbnb-base'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-console': 'off',
        'no-underscore-dangle': 'off',
        'class-methods-use-this': 'off',
        'max-len': ['error', { 'code': 120 }],
        'no-param-reassign': 'off',
        'camelcase': 'off',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
        'guard-for-in': 'off',
        'import/no-extraneous-dependencies': ['error', {
            'devDependencies': true
        }]
    }
}; 