import { Link as GatsbyLink } from "gatsby"
import React from 'react';

// Since DOM elements <a> cannot receive activeClassName,
// destructure the prop here and pass it only to GatsbyLink
const Link = ({ children, to, activeClassName, ...other }) => {
  // Tailor the following test to your environment.
  // This example assumes that any external link will start with "http"
  const external = /^http/.test(to)

  // Use Gatsby Link for internal links, and <a> for others
  if (!external) {
    return (
      <GatsbyLink to={to} activeClassName={activeClassName} {...other}>
        {children}
      </GatsbyLink>
    )
  }
  return (
    <a href={to} {...other}>
      {children}
    </a>
  )
}

export {Link};