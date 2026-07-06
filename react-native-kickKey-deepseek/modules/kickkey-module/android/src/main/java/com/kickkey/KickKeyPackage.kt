package com.kickkey

import expo.modules.kotlin.Package

class KickKeyPackage : Package {
    override fun createModules() = listOf(KickKeyModule())
}
