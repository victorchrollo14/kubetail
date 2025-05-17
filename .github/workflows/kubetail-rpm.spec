Name:           kubetail 
Version:        %{version} 
Release:        1%{?dist}
Summary:        Go based cli to get logs from kubernetes 

License:        Apache License Version 2.0
URL:            https://github.com/kubetail-org/kubetail
Source0:        %{name}-%{version}.tar.gz

BuildArch:      %{arch} 

%description
A longer description of your Go CLI tool and what it does.

%prep
%setup -q

%install
mkdir -p %{buildroot}%{_bindir}
install -m 755 %{_sourcedir}/%{name}-%{version}/kubetail %{buildroot}%{_bindir}/%{name}

%files
%{_bindir}/%{name}
