import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Platform } from 'react-native';

type LinkProps = React.ComponentProps<typeof Link>;

export function ExternalLink(
  props: Omit<LinkProps, 'href'> & { href: LinkProps['href'] }
) {
  return (
    <Link
      target="_blank"
      {...props}
      href={props.href}
      onPress={(e) => {
        if (Platform.OS !== 'web') {
          e.preventDefault();
          const url = typeof props.href === 'string' ? props.href : String(props.href);
          WebBrowser.openBrowserAsync(url);
        }
      }}
    />
  );
}
