import React from 'react';
import { conservationUnitHref } from '../webRoute.mjs';
import type { ConservationUnitLinkProps } from './ConservationUnitLink';

export function ConservationUnitLink({ name, onOpen, href }: ConservationUnitLinkProps) {
  return <a href={href ?? conservationUnitHref(name)} style={{ color: 'inherit', textDecoration: 'none', font: 'inherit' }}
    onClick={event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      onOpen(name);
    }}>{name}</a>;
}
