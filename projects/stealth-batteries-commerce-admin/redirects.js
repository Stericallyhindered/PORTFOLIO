const redirects = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  const productRedirects = [
    {
      source: '/products/stealth-lightning-charger-3-bank-24v',
      destination: '/products/lightning-charger-3-bank-24v',
      permanent: true,
    },
  ]

  const redirects = [internetExplorerRedirect, ...productRedirects]

  return redirects
}

export default redirects
