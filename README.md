# Plan

Use latest the node version 22.7 as it has awesome features, like:

- **watch mode**: nodemon isn't required anymore
- **a native tester**: maybe jest can be skipped too
- **support for typescript without configuration**: less configuration and running code without a build stage
- **sqlite out of the box**: yay!

These features should be enough for this task!

## Section 3

### 3A. Get data and save it locally

✅ Figure a way to save the hierarchical data (see product variations and categories for example)

- Variants have only one level of hierachy, with a light database table which doesn't replicate common date
- Categories can have as many levels of hiearchy as needed, they just need to have a parent. The exception is the Root category, which doesn't have a parent

✅ Figure a way to handle schemaless data (variations)

- I expect that there will be only one variable with a variation label, but I normalized it to a common database field

😑 Take into account that the database schema should support translations although the API doesn’t, use ISO 639-1 as language keys

- This one aspect I didn't work on.

✅ Add support for extra currencies

- Variations can be set with their own currencies. That might not be the best way for warehouse quantities, but that requirement wasn't mentioned. What I would like to update is to have a separate table for the prices, which would then point at the variant. This would also open possibilities for different price groups in the a single currency.

✅ How to update the product data from the API without re-saving everything but only parts that have changed

- I addad a hash of the JSON and stored that to the database. If the hash changes, then the product will be updated.

🤞 Also note that not every object have IDs

- There are internal IDs in the database even if the objects don't have them, which I think is a good habit. This keeps them out of sight and reduces the risk of exploitation.

## Thoughts

Ok, so a lot of getters are missing! Updates also need work -- old data isn't always cleared, for example although variants are updated, but if they are deleted, they'll stay as zombies in the database.

Normally I would have used zod and knex, maybe axios too, but it was fun to see how node is a more complete package nowadays! I didn't need to install almost any libraries to get the basic project running. Before I would have needed ts libs, a lot of config, testing library and configurations for that too. Now there was zero troubles getting esm working! 🥳

What I would do next, is add zod first, then maybe a config class and handle dependencies for classes in it so I could inject repos and utils from a single point. It could get useful if there would be different kinds of parsers for example and outward APIs.

As a lesson for myself who has been using nodejs v18, is that I'll need to update! These new features are awesome and hopefully v24 we'll have the experimental features ready 👍

### Setup

All that was needed!

```
npm init
npm install --save-dev tsx @types/node
```
