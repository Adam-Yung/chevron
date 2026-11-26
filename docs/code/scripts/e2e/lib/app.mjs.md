# scripts/e2e/lib/app.mjs

Opens the app for one spec with every outside request stubbed: Google suggestions answer with `"<q> one"` and `"<q> two"`, exchange
rates are fixed, and top-level navigations to outside URLs are recorded in `app.navigations` and answered with a stub page. Anything
else outside localhost is aborted, so a spec can never reach the network.

Console errors count as page errors except failed resource loads, which the aborted requests produce on purpose.
