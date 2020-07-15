# TODO

## `Don't know`s

 - [ ] Figure out what to do with `"http://schema.org/supersededBy"` on both Schemas and Properties
 - [ ] Figure out what to do with `"rdfs:subPropertyOf"` on Properties. Probably nothing, as a property, that is a subproperty of another, is being used in more specific schema. Semantically is similar, but for a more specific use case (schema) there is a more specific description (property).
 - [ ] DataType
   - this one is a bit tricky as it has Number, Text, ..., and those don't have properties nor can be used to create scope. Except for...
   - children of [Text](https://schema.org/Text) which have their own properties, and because DataType doesn't include Thing, which includes _base ...
   - I can't use the this._itemprop - probably I need to refactor it to import some kind of helper

## Ideas

 - [ ] Scrape schema.org pages to verify parsed data
   - that might be problematic, as there are pages that don't have the same specificity paths defined on them, even if schemas have well defined parents or types - can't tell why
 - [ ] when all schemas and properties are parsed - perhaps create a tool ensuring that everything is well done, e.g.:
   1. Check if there is only one root schema (Thing)
   1. Check if every path on the specificityPaths begins with Thing and ends with given schema's label
 - [ ] Make use of http://wiki.goodrelations-vocabulary.org/Documentation/UN/CEFACT_Common_Codes for https://schema.org/unitCode

### Schema builder class

 - [ ] split downloaded data to schemas and properties
 - [ ] introduce models for schemas and properties so that getters will create instances of given models on the fly
 - [x] add isSchema isProperty helper functions, as I check this here and there (have it defined in one place)
 - [ ] right now, the property methods return value in `content` attribute. Reverse that - return it as is, and if passed additional parameter, `attribute`, return it in that attribute. For example:
       
       ```js
       Place.name('A cool place.'); // `A cool place.`
       Place.name('A cool place.', 'content'); // `content="A cool place."`
       ```

### API usages [WIP]

Aimed result

```html
<div itemid="http://techcrunch.com/2015/03/08/apple-watch-event-live-blog" itemscope itemtype="http://schema.org/LiveBlogPosting">
    <div itemprop="about" itemscope itemtype="http://schema.org/Event">
        <span itemprop="startDate" content="2015-03-09T13:00:00-07:00">March 9, 2015 1:17 PM</span>
        <meta itemprop="name" content="Apple Spring Forward Event" />
    </div>
    <meta itemprop="coverageStartTime" content="2015-03-09T11:30:00-07:00" />
    <meta itemprop="coverageEndTime" content="2015-03-09T16:00:00-07:00" />
    <h1 itemprop="headline">Apple Spring Forward Event Live Blog</h1>
    <p itemprop="description">Welcome to live coverage of the Apple Spring Forward …</p>
    <div itemprop="liveBlogUpdate" itemscope itemtype="http://schema.org/BlogPosting">
        <h2 itemprop="headline">See the new flagship Apple Retail Store in West Lake, China.</h2>
        <p><span itemprop="datePublished" content="2015-03-09T13:17:00-07:00">March 9, 2015 1:17 PM</span></p>
        <div itemprop="video" itemscope itemtype="http://schema.org/VideoObject">
            <img itemprop="thumbnail" src="http://images.apple.com/live/2015-mar-event/images/908d2e_large_2x.jpg" />
        </div>
    </div>
    <div itemprop="liveBlogUpdate" itemscope itemtype="http://schema.org/BlogPosting">
        <h2 itemprop="headline">iPhone is growing at nearly twice the rate of the rest of the smartphone market.</h2>
        <p><span itemprop="datePublished" content="2015-03-09T13:13:00-07:00">March 9, 2015 1:13 PM</span></p>
        <img itemprop="image" src="http://images.apple.com/live/2015-mar-event/images/573cb_xlarge_2x.jpg"/>
    </div>
    <div itemprop="liveBlogUpdate" itemscope itemtype="http://schema.org/BlogPosting">
        <h2 itemprop="headline">Coming this April, HBO NOW will be available exclusively in the U.S. on Apple TV and the App Store.</h2>
        <p><span itemprop="datePublished" content="2015-03-09T13:08:00-07:00">March 9, 2015 1:08PM</span></p>
        <p itemprop="articleBody">It's $14.99 a month.<br> And for a limited time, …</p>
    </div>
</div>
```

#### On React components, for simple props addendum
```jsx harmony
import { LiveBlogPosting, Event } from 'project/to-object'; // What a crappy name ;) 

const component = () => {
    return (
        <div {...LiveBlogPosting.scope('http://techcrunch.com/2015/03/08/apple-watch-event-live-blog')}>
            <div {...LiveBlogPosting.about(Event.scope())}>
                <span {...Event.startDate('2015-03-09T13:00:00-07:00')}>March 9, 2015 1:17 PM</span>
                <meta {...Event.name('Apple Spring Forward Event')} />
             </div>
        </div>
    );
};
```

Every method call (`scope`, `about`, `startDate`, `name`) can take an argument. Doesn't have to.

 - `LiveBlogPosting.scope`
   - no argument, will create a scope for given schema. Here: `itemscope itemtype="http://schema.org/LiveBlogPosting"`
   - with argument, will provide the `itemid`, see: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/itemid
 - `LiveBlogPosting.about`
   - value is expected to have a [certain type](https://schema.org/about), here, it's an Event - which creates its own scope to describe that event
   - `about` knows what types of data it can hold as a value, therefore a validation will happen here 
 - `Event.startDate`
   - if no value is provided, one is to make sure that the `span` tag (used in the example) should hold value in a form [expected by that property](https://schema.org/startDate)
   - if value is there, it will be validated against [expected types](https://schema.org/startDate)    
 - `Event.name`
   - as `<meta />` tag is used, one is expected to provide a value, otherwise the `content` property won't be returned
     value is validated for what [name expects](https://schema.org/name)
   - if value would not be provided, name would be expected to be foun in the wrapping tag, so `meta` could not be used,
     but e.g. a `<span {...Event.name()}>Apple Spring Forward Event</span>`

#### On JS templates, for simple string renderings
```html
import { LiveBlogPosting, Event } from 'project/to-string'; // Again, what a crappy name ;) 

// And in a template

{% posts.map(post => { %}
    <div {{ LiveBlogPosting.scope('http://techcrunch.com/2015/03/08/apple-watch-event-live-blog') }}>
        <div {{ LiveBlogPosting.about(Event.scope()) }}>
            <span {{ Event.startDate(post.startDate) }}>{{ humanReadableDate(post.startDate) }}</span>
            <meta {{ Event.name(post.name) }} />
        </div>
    </div>
  {% }) %}

// Or in Svelte

<script>
    let structuredData = {
        liveBlogPosting: {
            scope: LiveBlogPosting.scope('http://techcrunch.com/2015/03/08/apple-watch-event-live-blog'),
            about: LiveBlogPosting.about(Event.scope())
        },
        event: {
            startDate: Event.startDate('2015-03-09T13:00:00-07:00'),
            name: Event.name('Apple Spring Forward Event')
        }
    }
</script>

<div {structuredData.liveBlogPosting.scope}>
    <div {structuredData.liveBlogPosting.about}>
        <span {structuredData.event.startDate}>March 9, 2015 1:17 PM</span>
        <meta {structuredData.event.name} />
    </div>
</div>
```

#### Creating json+ld format object (that can be stringified)

```js
import { LiveBlogPosting, Event } from 'project/to-schema-ld';

const structuredData = {
    ...LiveBlogPosting.scope('http://techcrunch.com/2015/03/08/apple-watch-event-live-blog'),
    ...LiveBlogPosting.about(
        Event.scope(),
        Event.startDate('2015-03-09T13:00:00-07:00'),
        Event.name('Apple Spring Forward Event')
    )
};
```

Here's one difference how a scope is introduced within a property value, in order to produce this:

```json+ld
{
  "@context":"http://schema.org",
  "@type":"LiveBlogPosting",
  "@id":"http://techcrunch.com/2015/03/08/apple-watch-event-live-blog",
  "about":{
    "@type":"Event",
    "startDate":"2015-03-09T13:00:00-07:00",
    "name":"Apple Spring Forward Event"
  }
}
```
