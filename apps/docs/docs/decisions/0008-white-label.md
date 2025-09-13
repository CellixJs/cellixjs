---
sidebar_position: 8
sidebar_label: 0008 White Label
description: "Use white label to allow users to choose their own domains for their communities."
# These are optional elements. Feel free to remove any of them.
status: accepted
contact: gidich
date: 04-23-2024
deciders: gidich
consulted: gidich, mgupta83
informed: etang93, heruwala, anil, duynguyen
---

# White label website using CraftJs + Blob Storage and Vercel

## Context and Problem Statement

OwnerCommunity needs a way to allow users to customize how the websites of their communities look and choose their own domains for them. This will allow users to have a more personalized experience and make it easier for them to share their communities with others.

## Decision Drivers

- **Personalization**: Allow users to customize their community websites and choose their own domains for their communities.

- **User Experience**: Improve the user experience by allowing users to have a more personalized experience.

- **Shareability**: Make it easier for users to share their communities with others.

- **Scalability**: Ensure that the solution can scale to support a large number of users and communities.

- **Cost-Effective**: Implement a cost-effective solution that can be easily maintained and scaled.

- **Performance**: Ensure that the solution is performant and can handle a large number of requests.

<!-- - **Security**: Implement a secure solution that protects user data and community websites. -->

## Considered Options

**Option #1: White label using CraftJS+Blob Storage and Vercel**

## Decision Outcome

Chosen option: **Option #1: White label using CraftJS+Blob Storage and Vercel**

## Pros and Cons of the Options

### White label using CraftJS+Blob Storage and Vercel

- **CraftJS**:
  - **Pros**
    - CraftJS is a flexible and powerful static site generator that allows us to build dynamic websites with ease.
    - CraftJS provides a rich set of features and plugins that make it easy to customize the look and feel of the website.
    - CraftJS is easy to use and has good documentation that makes it easy to get started.
  - **Cons**
    - CraftJS may have a learning curve for developers who are not familiar with it.
    - CraftJS may require additional setup and configuration to work with other services and tools.

- **Blob Storage**:
  - **Pros**
    - Blob Storage is a cost-effective and scalable solution for storing large amounts of data.
    - Blob Storage is easy to use and has good performance that makes it suitable for hosting static websites.
    - Blob Storage provides a secure and reliable way to store data that can be accessed from anywhere.
  - **Cons**
    - Blob Storage may require additional setup and configuration to work with other services and tools.
    - Blob Storage may have limitations in terms of performance and scalability for large websites.

- **Vercel**:
  - **Pros**
    - Vercel is cheap and provides unlimited domains
    - Vercel is easy to use and has good documentation that makes it easy to get started.
    - Vercel provides a secure and reliable way to host websites that can be accessed from anywhere.
  - **Cons**
    - Vercel has expensive bandwidth.

## Links

- [CraftJS](https://craftjs.org/)
- [Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)
- [Vercel](https://vercel.com/)
```
