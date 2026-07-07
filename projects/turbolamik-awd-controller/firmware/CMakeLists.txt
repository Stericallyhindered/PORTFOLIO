cmake_minimum_required(VERSION 3.16)

if(DEFINED ENV{IDF_PATH})
  include($ENV{IDF_PATH}/tools/cmake/project.cmake)
  project(turbolamik_awd_controller)
else()
  project(turbolamik_awd_controller_host C)
  add_subdirectory(components/awd_core)
endif()
