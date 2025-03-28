import React from "react";
import commonStyles from "../../common_styles.module.css";
import styles from "./styles.module.css";
import { italicBold, underlineBold } from "../../common";
import { MdOutlineArrowRightAlt } from "react-icons/md";
import { Overwhelmed } from "./overwhelmed";
import { ScaledUpCourier } from "./scaled_up_courier";
import { Emoji } from "src/constants/emojis";
import { Hierarchy } from "./hierarchy";

export const ScalingUp: React.FC = () => {
  return (
    <div id={styles.container}>
      <p>
        So far, we’ve built a small, efficient courier service. But as more
        people start using it, we face new challenges—delivering to distant
        locations, handling more shipments, and optimizing routes.
      </p>
      <h3 className={commonStyles.heading}>
        Challenges faced by a Central Hub
      </h3>
      <p>
        A single courier hub works well for a small town, but what if we need to
        deliver across multiple cities? We can’t rely on a single hub anymore—we
        need regional hubs and an organized delivery system.
      </p>
      <ul className={commonStyles.list}>
        <li>
          A single hub {italicBold("would run out of its processing capacity")}{" "}
          very quickly as the volume of shipments increases. Sorting,
          processing, and dispatching delays would occur as the hub becomes a
          bottleneck.
        </li>
        <li>
          {italicBold("Physical Storage constraints")} would come into play,
          slowing down operations.
        </li>
        <li>
          A single hub means every package must first travel to that location
          before reaching its destination. <br />
          <MdOutlineArrowRightAlt /> This would lead to{" "}
          {italicBold("significant delays due to unnecessary detours")}.<br />
          Example: A package from New York to Chicago shouldn’t need to go
          through a hub in Los Angeles first.
        </li>
      </ul>
      <Overwhelmed />
      <h3 className={commonStyles.heading}>Scaling Up Our Hub</h3>
      In order to resolve all of these challenges, we need to do the following:
      <ul className={commonStyles.list}>
        <li>
          {italicBold("Increase")} the number of offices and create a{" "}
          {italicBold("distributed network of offices")} to handle shipments
          over a large geographical service area.
        </li>
        <li>
          Each office handles shipments for its nearby locations. This prevents
          congestion at a single hub and ensures faster, more efficient
          deliveries.
          <br />
          <MdOutlineArrowRightAlt /> In technical terms, this is known as{" "}
          {underlineBold("horizontally scaling up resources")}.
        </li>
        <li>
          We need to come up with an efficient {italicBold("redirection logic")}{" "}
          to efficiently handle shipments across the wide service area.
          <br />
          <MdOutlineArrowRightAlt /> This should enable our offices to hand
          shipments over to other offices closest to the destination, and then
          achieving efficient last mile delivery.
        </li>
      </ul>
      <h3 className={commonStyles.heading}>Building a Routing Logic</h3>
      <p>
        Before we proceed, let us remind ourselves of the primary problem faced
        by a single courier office serving a large area:
      </p>
      <ul className={commonStyles.list}>
        <li>
          A single office is unable to serve every single address in the large
          area and needs to be given a manageable workload.
        </li>
        <li>
          Even if it hands off packages to other offices,{" "}
          {italicBold("it cannot keep track of every single address")} and which
          office should handle it.
        </li>
        Thus, to achieve this, we need a way to{" "}
        {underlineBold("group and simplify")} (i.e. {underlineBold("aggregate")}
        ) our routes so that packages can be efficiently directed to the right
        locations.
      </ul>
      <h4 className={commonStyles.sub_heading}>Prefix-based Aggregation</h4>
      <ul className={commonStyles.list}>
        <li>
          A {italicBold("prefix")} is a word, letter, or number placed before
          another. <i>Every number is a prefix of itself.</i>
          <ul>
            <li>
              {italicBold("1, 10, 100, & 1000")} are the prefixes of the number{" "}
              {italicBold("1000")}
            </li>
            <li>
              {italicBold("5, 50, & 505")} are the prefixes of the number{" "}
              {italicBold("505")}
            </li>
          </ul>
        </li>
        <li>
          {italicBold("Prefix Aggregation")} a method used to group related
          numbers by their shared prefixes.
          <br />
          Instead of listing every individual number in a range, we can
          summarize them using a common starting sequence. For Example:
          <ul>
            <li>
              The range {italicBold("50 to 59")} can be represented as{" "}
              {italicBold("5x")}
            </li>
            <li>
              The range {italicBold("1000 to 1999")} can be represented as{" "}
              {italicBold("1xxx")}
            </li>
            <li>
              The range {italicBold("250 to 259")} can be represented as{" "}
              {italicBold("25x")}
            </li>
          </ul>
          <p>
            {Emoji.Bulb}
            <b>Exercise:</b> Can you summarize the range{" "}
            {italicBold("600 - 609")}?
          </p>
        </li>
        <li>
          This concept is widely used in varied fields to{" "}
          {italicBold("summarize data")}.
        </li>
        <li>
          Using prefix aggregation, we can store or process large sets of
          numbers more efficiently.
        </li>
        <li>
          Example: Instead of tracking every number from{" "}
          {italicBold("1000 to 1999 ")}
          individually, we can represent them all with a single entry:{" "}
          {italicBold("1xxx")}.
        </li>
        <li>
          The {underlineBold("Specificity")} of a prefix aggregation range
          refers to how precisely a given prefix defines a subset of elements
          within a larger system.
          <ul>
            <li>
              A {underlineBold("high-specificity")} prefix covers a smaller,
              more precisely defined group and has less number of digits
              available for manipulation, whereas,
            </li>
            <li>
              A {underlineBold("low-specificity")} prefix encompasses a broader
              range of elements and has more digits available for manipulation.
            </li>
            <li>
              Example: 10xx covers 100 possibilities (1000 - 1099), whereas 100x
              covers 10 possibilities (1000 - 1009).
              <br />
              <b>
                Here, <i>100x</i> is more specific than <i>10xx</i>
              </b>
            </li>
          </ul>
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>
        Summarizing Routes using Prefix Aggregation
      </h4>
      <p>
        There is a convenient component of physical addresses which neatly
        divides geographic regions based on its value. Can you guess what it is?
      </p>
      <p>If you guessed {italicBold("zip codes")}, you are correct!</p>
      <ul className={commonStyles.list}>
        <li>
          Zip codes are structured in a way that
          {italicBold(
            " allows us to group locations by their shared numeric prefixes"
          )}
          .
          <br />
          <b>
            This makes them an excellent tool for aggregating delivery routes
            efficiently.
          </b>
        </li>
        <li>
          The {italicBold("specificity")} of the zip codes{" "}
          {italicBold("increases")} as you zoom in.
          <p>For example, in the U.S.,</p>
          <ul className={commonStyles.list}>
            <li>
              All zip codes in the {italicBold("Midwest region")} start with a{" "}
              {italicBold("4, 5, or 6")}.
              <br />
              <MdOutlineArrowRightAlt /> We can say that the midwest region has
              zip codes in the ranges {italicBold("4xxxx, 5xxxx, or 6xxxx")}.
              <br />
              Within the midwest region,
              <ul>
                <li>
                  <b>Chicago zip codes start with a 606</b>, i.e. Chicago has
                  codes in the range {italicBold("606xx")}
                </li>
              </ul>
              {Emoji.Bulb} Notice how the specificity of the zip code increased
              as we zoomed in to Chicago from Midwest.
            </li>
            <li>
              All zip codes in the {italicBold("Northeast region")} start with a{" "}
              {italicBold("0 or 1")}.<br />
              <MdOutlineArrowRightAlt /> We can say that the northeast region
              has zip codes in the ranges {italicBold("0xxxx or 1xxxx")}.<br />
              Within the northeast region,
              <ul>
                <li>
                  <b>Boston zip codes start with a 021 or 022</b>, i.e. Boston
                  has codes in the range {italicBold("021xx")} and{" "}
                  {italicBold("022xx")}.
                </li>
              </ul>
              {Emoji.Bulb} Again, notice how the specificity of the zip code
              increased as we zoomed in to Boston from Northeast.
            </li>
          </ul>
        </li>
      </ul>
      <h4 className={commonStyles.sub_heading}>
        How Prefix Aggregation Simplifies Routing
      </h4>
      <p>
        By using prefix aggregation, a courier system doesn’t need to list every
        individual ZIP code separately. Instead, it can store just the shared
        prefix for an entire region.
      </p>
      <p>
        Instead of maintaining an overwhelming number of mappings for every
        single ZIP code, couriers can use regional hubs and direct shipments
        based on summarized prefixes:
      </p>
      <table className={styles.routing_table}>
        <tbody>
          <tr>
            <th>Prefix</th>
            <th>Region</th>
            <th>Route to</th>
          </tr>
          {[
            [
              "606xx",
              "Chicago, IL",
              "Chicago Regional Hub, W Madison St, 60661",
            ],
            ["021xx", "Boston, MA", "Boston Regional Hub, W Madison St, 02101"],
          ].map(([prefix, region, routeTo]) => (
            <tr key={prefix}>
              <td>{prefix}</td>
              <td>{region}</td>
              <td>{routeTo}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        For instance, a package addressed to 60657 doesn’t need to be matched
        with all possible ZIP codes in Chicago. Instead, a courier system can
        recognize that 606xx represents a general region and route it
        accordingly.
      </p>
      <p>Thus, this method of prefix aggregation helps courier networks:</p>
      <ul className={commonStyles.list} id={styles.advantages}>
        <li>
          <b>Reduce the number of route entries</b>
        </li>
        <li>
          <b>Improve efficiency in package forwarding</b>
        </li>
        <li>
          <b>Simplify regional sorting and delivery operations</b>
        </li>
      </ul>
      <h3 className={commonStyles.heading}>Structuring our Courier Network</h3>
      <ul className={commonStyles.list}>
        <li>
          To build an efficient network, we will build a{" "}
          {underlineBold("hierarchical structure of our offices")}, which would
          help us simplify our operations and reduce their randomness.
        </li>
        <li>
          This structure will be based on route aggregation we discussed in the
          previous section:
          <ul>
            <li>
              As you {italicBold("move down")} the hierarchy, offices serve{" "}
              {italicBold("increasingly specific")} zip codes.
            </li>
            <li>
              As you {italicBold("move up")} the hierarchy, offices serve a{" "}
              {italicBold("broader range")} of zip codes.
            </li>
          </ul>
        </li>
        <li>
          This ensures that:
          <ul>
            <li>
              Offices higher in the hierarchy only need to redirect shipments to
              offices one level below them.
              <br />
              <b>
                Hence, they aren't concerned with delivering shipments to a huge
                number of addresses.
              </b>
            </li>
            <li>
              Offices lower in the hierarchy serve limited geographic regions,{" "}
              {italicBold(
                "limiting their range and making their workloads more manageable."
              )}
            </li>
          </ul>
        </li>
      </ul>
      <p>Example:</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Hierarchy width={"75%"} />
      </div>
      <p>
        We can now use the prefix-based routing logic we built up in the
        previous section to simplify routing and minimize its cost, improving
        the efficiency of our network.
      </p>
      <h4 className={commonStyles.sub_heading}>Introducing the Hierarchy</h4>
      <p>
        To serve a large geographical region efficiently, we'll introduce a
        hierarchy in our courier offices by classifying our offices into{" "}
        <b>local, regional</b>, and <b>national</b> hubs.
      </p>
      <ul className={commonStyles.list}>
        <li>
          {underlineBold("Local Offices")}: <br />
          <ul>
            <li>
              Handle shipments within a small region, i.e.{" "}
              <b>Last mile deliveries</b>.
            </li>
            <li>
              Collect and distribute packages locally{" "}
              <b>within specific zip codes</b>, i.e., they{" "}
              {italicBold("serve the most specific zip codes")}. These are the
              offices that the customers interact with.
            </li>
            <li>
              Work as follows:
              <br />
              Given a destination zip code,
              <ol>
                <li>They check if the zip code is the one they service.</li>
                <li>
                  If yes, they deliver this shipment directly.
                  <br />
                  Else, they forward this shipment to their nearest regional hub
                  for long distance delivery.
                </li>
              </ol>
            </li>
            <li>
              Are minimally staffed and have minimal backup offices.{" "}
              <b>
                A temporary closure does not affect the other parts of our
                courier network.
              </b>
            </li>
          </ul>
        </li>
        <li>
          {underlineBold("Regional Hubs")}: <br />
          <ul>
            <li>
              Serve a broader geographical area{" "}
              <b>covering a range of zip codes</b>.<br />
              {italicBold(
                "This range can be summarized using a prefix-based aggregation of zip codes."
              )}
              <br />
              Example, a Chicago regional hub may serve the range{" "}
              {italicBold("606xx")}, since this range is specific to Chicago and
              encompasses all the zip codes within the region.
            </li>
            <li>
              Are staffed well and have a backup regional hub, since{" "}
              <b>
                a closure here would handicap deliveries for an entire region.
              </b>
            </li>
            <li>
              Work as follows:
              <br />
              Given a destination zip-code:
              <ol>
                <li>
                  Check if the destination zip-code falls within the range of
                  zip-codes served by this regional hub.
                </li>
                <li>
                  If yes, it forwards the shipment to the appropriate local
                  office serving the exact zip code.
                  <br />
                  Else, it forwards the shipment to the national hub whose
                  serviceable range matches the longest with the destination
                  zip.
                </li>
              </ol>
            </li>
          </ul>
        </li>
        <li>
          {underlineBold("National Hubs")}:<br />
          <ul>
            <li>
              {" "}
              Serve as central points for country wide shipments, serving
              multiple states.
            </li>
            <li> Serve a {italicBold("high volume")} of shipments.</li>
            <li>
              {" "}
              Are staffed well and are typically{" "}
              <b>never closed, operating 24 / 7.</b>
            </li>
            <li>
              Again, given a shipment with a destination zip code, it{" "}
              <b>
                forwards the shipment to the regional hub whose service range
                matches the longest prefix of the zip-code.
              </b>
            </li>
          </ul>
        </li>
      </ul>
      <h3 className={commonStyles.heading}>A Sample Network</h3>
      We will now create a scaled up courier service serving the USA! For
      simplicity, we'll keep our geographic region constrained to the North East
      and Midwest, serving several zip codes in New York, Boston, Detroit, and
      Chicago.
      <ScaledUpCourier />
      <h4 className={commonStyles.sub_heading}>Our Local Offices</h4>
      <p>
        As mentioned above, these offices are concerned with the last mile
        deliveries of shipments. We will have <b>one office per zip code</b>.
        <br />
        The following is a list of all the local offices in our network:
      </p>
      <ol className={commonStyles.list}>
        <li>{underlineBold("Chicago")}: 60661, 60666.</li>
        <li>{underlineBold("Detroit")}: 48127, 48201</li>
        <li>{underlineBold("Boston")}: 02115, 02203</li>
        <li>{underlineBold("New York")}: 10001, 10203</li>
      </ol>
      <h4 className={commonStyles.sub_heading}>The Regional Hubs</h4>
      <p>
        Regional hubs cover a broader geographical area. We will use{" "}
        {italicBold("prefix aggregation on zip codes")} to formalize the service
        area of each hub.
        <br />
        The following is a list of all the regional hubs in our network:
      </p>
      <ol className={commonStyles.list}>
        <li>
          {underlineBold("Chicago")}: <br />
          <ul>
            <li>
              Zip codes pertaining to Chicago can be aggregated to{" "}
              {italicBold("606xx")}.
            </li>
            <li>
              There is no other city in the U.S. whose zip code starts with 606.
            </li>
            <li>
              Hence, this hub advertises that it can serve all the zip codes{" "}
              {italicBold("starting with 606")}
            </li>
          </ul>
        </li>
        <li>
          {underlineBold("Detroit")}:<br />
          <ul>
            <li>
              Zip codes pertaining to Detroit can be aggregated to{" "}
              {italicBold("481xx")} and {italicBold("482xx")}.
            </li>
            <li>
              Hence, this hub advertises that it can serve all the zip codes{" "}
              {italicBold("starting with 481 and 482")}
            </li>
          </ul>
        </li>
        <li>
          {underlineBold("Boston")}:<br />
          <ul>
            <li>
              Zip codes pertaining to Boston can be aggregated to{" "}
              {italicBold("021xx")} and {italicBold("022xx")}.
            </li>
            <li>
              There is no other city whose zip code starts with 021 or 022.
            </li>
            <li>
              Hence, this hub advertises that it can serve all the zip codes{" "}
              {italicBold("starting with 021 and 022")}
            </li>
          </ul>
        </li>
        <li>
          {underlineBold("New York")}:<br />
          <ul>
            <li>
              Zip codes pertaining to New York can be aggregated to{" "}
              {italicBold("100xx, 101xx, 102xx, 103xx, 104xx, and 110xx")}.
            </li>
            <li>
              Hence, this hub advertises that it can serve all the zip codes{" "}
              {italicBold("starting with 100 - 104 and 110")}
            </li>
          </ul>
        </li>
      </ol>
      <h4 className={commonStyles.sub_heading}>The National Hubs</h4>
      <p>
        Finally, we create the region-wise National hubs serving the Northeast
        and Midwest regions of the States.
      </p>
      <ul className={commonStyles.list}>
        <li>
          All the locations within the midwest region have a zip code starting
          with 4 or 6. No location outside the mid-west region has a zip code
          starting with 4. Hence,{" "}
          <b>
            our midwest hub serves all the zip codes in the range 4xxxx and
            6xxxx.
          </b>
        </li>
        <li>
          Using the same logic,{" "}
          <b>
            our northeast hub serves all the zip codes in the range 0xxxx and
            1xxxx.
          </b>
        </li>
      </ul>
      <h3 className={commonStyles.heading}>Conclusion</h3>
      <p>
        With that, we have successfully established an efficient courier network
        covering a vast region. In the next chapter, we will explore how the
        concept of {italicBold("hierarchical routing")} which formed the
        foundation of our courier network serves as the basis of the
        organization of the modern day internet!
        <br />
        Also, the concept of {italicBold("aggregation of addresses")} and the
        subsequent {italicBold("forwarding logic")} based on it that we applied
        to zip codes in our courier network will be used in our computer network
        with IP addresses!
      </p>
    </div>
  );
};
