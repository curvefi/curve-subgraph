module.exports = {
  ...require('@graphprotocol/graph-ts/.prettierrc.json'),

  printWidth: 120,

  overrides: [
    {
      files: '*.graphql',
      options: {
        printWidth: 80,
      },
    },
    {
      files: '*.json',
      options: {
        printWidth: 80,
      },
    },
  ],
}
