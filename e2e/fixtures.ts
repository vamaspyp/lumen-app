import {test as base} from '@playwright/test'
// External typography is not part of the functional contract. Keep QA independent
// of Google Fonts latency; Auth, Source and application RPCs are untouched.
export const test=base.extend({page:async({page},provide)=>{
 await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//,route=>route.abort())
 await provide(page)
}})
export {expect} from '@playwright/test'
export type {Page} from '@playwright/test'
