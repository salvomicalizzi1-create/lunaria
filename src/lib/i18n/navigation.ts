import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Use these everywhere instead of next/link and next/navigation, so a link can
 *  never drop the locale and land the visitor in the wrong language. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
