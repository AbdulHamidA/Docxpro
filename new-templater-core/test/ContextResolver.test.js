const ContextResolver = require("../src/utils/ContextResolver");
const assert = require("assert");

describe("ContextResolver", () => {
  const context = {
    name: "John",
    age: 30,
    user: {
      firstName: "Jane",
      lastName: "Doe",
      address: {
        street: "123 Main St",
        city: "Anytown",
        country: "USA",
      },
    },
    items: [
      { name: "Item 1", price: 10.99 },
      { name: "Item 2", price: 25.50 },
    ],
    nullValue: null,
    undefinedValue: undefined,
    emptyString: "",
    zeroValue: 0,
    falseValue: false,
  };

  it("should resolve simple property paths", () => {
    assert.strictEqual(ContextResolver.resolve(context, "name"), "John");
    assert.strictEqual(ContextResolver.resolve(context, "age"), 30);
  });

  it("should resolve nested property paths", () => {
    assert.strictEqual(ContextResolver.resolve(context, "user.firstName"), "Jane");
    assert.strictEqual(ContextResolver.resolve(context, "user.lastName"), "Doe");
    assert.strictEqual(ContextResolver.resolve(context, "user.address.street"), "123 Main St");
    assert.strictEqual(ContextResolver.resolve(context, "user.address.city"), "Anytown");
    assert.strictEqual(ContextResolver.resolve(context, "user.address.country"), "USA");
  });

  it("should resolve array elements", () => {
    assert.deepStrictEqual(ContextResolver.resolve(context, "items"), context.items);
    assert.deepStrictEqual(ContextResolver.resolve(context, "items.0"), context.items[0]);
    assert.strictEqual(ContextResolver.resolve(context, "items.0.name"), "Item 1");
    assert.strictEqual(ContextResolver.resolve(context, "items.1.price"), 25.50);
  });

  it("should return undefined for non-existent paths", () => {
    assert.strictEqual(ContextResolver.resolve(context, "nonExistent"), undefined);
    assert.strictEqual(ContextResolver.resolve(context, "user.nonExistent"), undefined);
    assert.strictEqual(ContextResolver.resolve(context, "user.address.nonExistent"), undefined);
  });

  it("should return default value for non-existent paths", () => {
    assert.strictEqual(ContextResolver.resolve(context, "nonExistent", "default"), "default");
    assert.strictEqual(ContextResolver.resolve(context, "user.nonExistent", 42), 42);
    assert.strictEqual(ContextResolver.resolve(context, "user.address.nonExistent", null), null);
  });

  it("should handle null and undefined values correctly", () => {
    assert.strictEqual(ContextResolver.resolve(context, "nullValue"), null);
    assert.strictEqual(ContextResolver.resolve(context, "undefinedValue"), undefined);
  });

  it("should handle falsy values correctly", () => {
    assert.strictEqual(ContextResolver.resolve(context, "emptyString"), "");
    assert.strictEqual(ContextResolver.resolve(context, "zeroValue"), 0);
    assert.strictEqual(ContextResolver.resolve(context, "falseValue"), false);
  });

  it("should handle invalid inputs gracefully", () => {
    assert.strictEqual(ContextResolver.resolve(null, "name"), undefined);
    assert.strictEqual(ContextResolver.resolve(undefined, "name"), undefined);
    assert.strictEqual(ContextResolver.resolve(context, null), undefined);
    assert.strictEqual(ContextResolver.resolve(context, undefined), undefined);
    assert.strictEqual(ContextResolver.resolve(context, ""), undefined);
    assert.strictEqual(ContextResolver.resolve(context, 123), undefined);
  });

  it("should handle deep nesting", () => {
    const deepContext = {
      level1: {
        level2: {
          level3: {
            level4: {
              value: "deep value",
            },
          },
        },
      },
    };
    assert.strictEqual(ContextResolver.resolve(deepContext, "level1.level2.level3.level4.value"), "deep value");
  });

  it("should handle paths that traverse through null/undefined", () => {
    const contextWithNulls = {
      user: null,
      data: {
        nested: undefined,
      },
    };
    assert.strictEqual(ContextResolver.resolve(contextWithNulls, "user.name"), undefined);
    assert.strictEqual(ContextResolver.resolve(contextWithNulls, "data.nested.value"), undefined);
    assert.strictEqual(ContextResolver.resolve(contextWithNulls, "user.name", "default"), "default");
  });

  // it("should handle edge cases with property names", () => {
  //   const edgeCaseContext = {
  //     "": "empty key",
  //     "key.with.dots": "dotted key",
  //     "123": "numeric key",
  //   };
  //   assert.strictEqual(ContextResolver.resolve(edgeCaseContext, ""), "empty key");
  //   // Note: This resolver doesn\\\'t handle keys with dots in their names
  //   // It would split "key.with.dots" into separate path segments
  //   assert.strictEqual(ContextResolver.resolve(edgeCaseContext, "123"), "numeric key");
  // });
});

