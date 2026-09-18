---
title: "Release Guide"
sidebar_label: Release
description: "The checklist for releasing microproducts that informs prior phases of development."
slug: /playbook/build/release
tags: [playbook, build]
last_reviewed: 2026-09-10
authors: [rowan-lindsay]
---

The purpose of microproduct development and iteration is to bring value to users, which means making technology accessible.
At a high level, releasing means putting something new into the world or changing something that already exists.
Releases can be small or large depending on factors such as changed LOC, potential impact and exposure. Even a single-line change is considered a 'large' release if it's potential impacts are great.

Releasing software is scary and potentially complex. Any number of things could go wrong once the changes are out there or during the release process itself.
Like many topics covered in the playbook, entire books could (and have) been written about it, and managing releases can be a full-time job. We won't try to simplify or downplay that here.
However, to empower builders like yourself, we will cast a wide net over the topic and provide a top-down framework for you to make decisions.
The highest-risk aspects of releases are the ones you haven't thought about. Our release checklist helps with this.

## Release Decisions
A release decision determines whether a release candidate will be made accessible to some or all users.
Explicit release decisions should always be made, no matter how large or small a release is. For large companies, this provides audit guarantees in case something goes wrong.
For any sized team, including individual builders, the decision making process ensures that all key components are accounted for.

Release decisions may or not be automated, but they should always be systematized. A release system and decision making algorithm allows for maximum coverage in the current iteration, while serving as a basis for improvement. Whether or not all parts of the checklist are included in your CI/CD, treat it like you would a script in your codebase.

> Term - **Release Candidate** (RC):
> A snapshot of source code - including static configuration files and deployment scripts - being evaluated for release. Usually a tagged commit.

## The Big Picture
Whether you are prepping for a demo, gearing up for a public launch, or shipping a small new enhancement, making a release decision starts with asking the right questions. We break these down into three top-level queries, which will be answered using a combination of automated checks, manual verification and plain old human intuition:

1. Is it the right time to release?
2. Will the release have the expected impacts?
3. Does the RC make sense in the environment we are releasing into?

> Term - **Impacts**: Any results of releasing the RC. Include updating code running on servers, changing configurations, mutating cloud resources, and even
running scripts to manipulate data where appropriate. Adding/modifying (or removing) a feature is considered an impact. Making a website exist on
a domain that did not exist before is also an impact. So is fixing a bug.

Put simply, always consider: 1) What you have built - is it build correctly? 2) did you build the right thing, and is now the time to put it out into the world?

The following sections expand more on these central pillars.

## Timing
Deciding *when* to do a release seems simple at first - after all, shouldn't products and features be released as soon as they are implemented and tested? However, there are a few factors to consider:

- **Feature Set**: When doing an initial launch, consider whether the requirements for your MVP have been met. Does the product have enough functionality to be useful? Assess whether the overhead and risks of doing the release are even worth the value being added.

- **Release Cycles**: Some teams have a specific cadence or days/times they deploy. Users may be accustomed to a particular cadence.

- **Internal Preparedness**: Are the product and/or its operators ready for exposure and usage? Evaluate the cost and legal implications of a product going public. Ensure appropriate control over exposure using tools like Feature Flags, Authentication and Authorization rules, networking restrictions (whitelists, firewalls) and other security measures depending on the risks.

- **Dependency coordination**: If you are depending on the availability of features or infrastructure shipped by other teams, make sure the timelines match up and there are backup plans in place.

- **Downtime**: If there is expected to be downtime, consider releasing at a time when usage is low and communicating the release plan.

> Term - **Downtime**: Any time where previously available and/or expected functionality are not available (even if no users try to use it). Commonly this is a
service outage where a server cannot be reached but there are other examples such as where a bug makes a feature inaccessible or not work properly.

## Release Quality
Every release candidate should satisfy requirements and meet functional and technical specifications. The release verification process essentially determines whether the release will have all of - and only - the expected impacts and deliver expected outcomes.

This is a large topic that deserves its own article, and there are many different systems around it depending on product type, team size and technology.

Suffice it to say here that release quality checks are a vital part of the release checklist, should be mostly automated as the feature set and complexity grow over time, and rely on a number of tools and processes to be used earlier in the development pipeline.

## Environment
Assuming your release does exactly what it's expected to in a test environment, will it work properly with other systems when it goes to production? Does the product as designed actually add value in the market?

It's one thing to have a system that produces green checks across all tests. It's quite another to have a functional and relevant product in the real world.

Here are some of the conditions that concern release-candidate/environment fit:
- Required infrastructure and dependencies are in place. Consider other resources controlled by you that must be present for the code to work. Usually these are cloud resources such as AWS S3 buckets, message brokers.

- The product is compatible with other systems. Make sure that API contracts are upheld and that dependencies like external APIs can meet the non-functional requirements of your product such as performing under heavy loads.

- The product fits the market and delivers on user requirements and expectations. Previous work and artifacts like market research and user studies come into play here.

## Release Process
Finally, your release process itself may have its own unexpected impacts. You must prepare for this.

- Write a deployment plan, including any system upgrades or migrations, and test it in your staging environment.
- Prepare (and test) your rollback procedure.

Whenever possible, automate and/or systematize deployments and rollbacks and commit them to version control.

> Term - **Rollback**: Reverting deployed instances to the previous release candidate - effectively removing the effects of the release. This is typically done
when a release immediately causes downtime once deployed and a previous release candidate is considered stable.

## Conclusion
This guide is intended to bring best practices from industry software development and cover the most important characteristics of a good release. Applying these to microproducts - no matter how small - will help you consistently deliver maximum value with the lowest risk.

A number of tools and processes are not covered here, including specifics about release quality assurance, automated testing and verification. Keep an eye out for other articles covering those. They will be linked here as they are published.
