import { micromark } from 'micromark';
import { hugoShortcode, hugoShortcodeHtml } from './dev/lib/syntax.js';

// Test standard notation
const testStandard = `
{{< b >}}{{< /b >}}

1{{< b  a="1" >}}2{{< /b >}}3

f{{<b a="1" />}}d

[sdss]({{< rel.ref "2.22" >}})

This is a test with {{< figure src="/images/test.jpg" alt="A test image" >}}.

{{< highlight j.s >}}
function hello() {
  console.log("Hello, Hugo!");
}
{{< /highlight >}}
{
Self-closing: {{< qr text="https://gohugo.io" />}}
`;

// Test markdown notation
const testMarkdown = `
This is a test with {{% figure src="/images/test.jpg" alt="A test image" %}}.

{{% highlight js %}}
function hello() {
  console.log("Hello, Hugo!");
}
{{% /highlight %}}

Self-closing: {{% qr text="https://gohugo.io" /%}}
`;

console.log('Testing standard notation:');
console.log(
  micromark(testStandard, {
    extensions: [hugoShortcode()],
    htmlExtensions: [hugoShortcodeHtml()],
  }),
);

console.log('\n\nTesting markdown notation:');
console.log(
  micromark(testMarkdown, {
    extensions: [hugoShortcode()],
    htmlExtensions: [hugoShortcodeHtml()],
  }),
);
