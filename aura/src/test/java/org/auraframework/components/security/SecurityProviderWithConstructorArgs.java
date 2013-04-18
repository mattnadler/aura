/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.auraframework.components.security;

import org.auraframework.def.DefDescriptor;
import org.auraframework.def.SecurityProvider;

/**
 * A security provider with an argument to the constructor.
 * 
 * This will fail due to an inability to construct the provider.
 */
public class SecurityProviderWithConstructorArgs implements SecurityProvider {
    public SecurityProviderWithConstructorArgs(int unused) {
    }

    @Override
    public boolean isAllowed(DefDescriptor<?> descriptor) {
        return true;
    }
}
