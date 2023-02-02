import React from "react";
import PageBanner from "../src/components/PageBanner";
import Footer from "../src/layout/Footer";
import Header from "../src/layout/Header";

const Cancellation = () => {
  return (
    <>
      <Header />
      <PageBanner pageName={"Cancellation and Refund policy "} />
      <div>
        <section className="about-page-section pt-120 rpt-90">
          <div className="container">
            <div className="row align-items-center large-gap">
              <div className="col-lg-12">
                <p>
                  Education Nest is committed to providing quality educational content to our candidates. We understand that sometimes circumstances change, and you may need to cancel or request a refund. This policy outlines the process for doing
                  so.{" "}
                </p>
                <p>Cancellation Policy: </p>
                <p>
                  &#x2022; Candidates may cancel their subscription to a course within one month of purchase.
                  <br /> &#x2022; Requests for cancellations beyond one month will not be accepted.
                  <br /> &#x2022; To cancel, candidates must contact Education Nest through the designated support channels.{" "}
                </p>
                <p>Refund Policy: </p>
                <p>
                  &#x2022; Education Nest offers a 15-day, no-questions-asked money-back guarantee on all courses.
                  <br /> &#x2022; To request a refund, candidates must contact Education Nest within 15 days of purchase.
                  <br /> &#x2022; Refunds will be processed within a reasonable amount of time.
                  <br /> &#x2022; Education Nest reserves the right to suspend or terminate a candidate's account if it believes the candidate is abusing the refund policy.
                </p>
                <p>
                  <strong>Note:</strong>This policy is subject to change at the sole discretion of Education Nest without any liability. If you have any questions or concerns regarding this policy, please contact our support team.{" "}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Cancellation;
